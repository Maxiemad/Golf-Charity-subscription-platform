from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import asyncio
import resend
import random
import secrets
from bson import ObjectId
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get("JWT_SECRET")
JWT_ALGORITHM = "HS256"

# Stripe Configuration
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")

# Resend Configuration
resend.api_key = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

# Subscription Pricing (monthly in USD)
SUBSCRIPTION_PRICES = {
    "monthly": 20.00,
    "yearly": 200.00  # ~16.67/month (2 months free)
}

# Create the main app
app = FastAPI()

# Create API router
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ MODELS ============

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    subscription_status: str
    subscription_tier: Optional[str] = None
    subscription_end_date: Optional[datetime] = None
    selected_charity_id: Optional[str] = None
    charity_contribution_percentage: int = 10

class ScoreCreate(BaseModel):
    score_value: int = Field(..., ge=1, le=45)
    score_date: str

class ScoreResponse(BaseModel):
    id: str
    user_id: str
    score_value: int
    score_date: str
    created_at: datetime

class CharityCreate(BaseModel):
    name: str
    description: str
    image_url: str
    featured: bool = False
    upcoming_events: Optional[List[str]] = []

class CharityResponse(BaseModel):
    id: str
    name: str
    description: str
    image_url: str
    featured: bool
    upcoming_events: List[str]
    created_at: datetime

class SelectCharityRequest(BaseModel):
    charity_id: str

class UpdateContributionRequest(BaseModel):
    percentage: int = Field(..., ge=10, le=100)

class DrawResponse(BaseModel):
    id: str
    draw_date: datetime
    draw_numbers: List[int]
    status: str
    prize_pool_total: float
    prize_pool_5_match: float
    prize_pool_4_match: float
    prize_pool_3_match: float
    winners_5_match: int
    winners_4_match: int
    winners_3_match: int

class VerificationUpload(BaseModel):
    draw_id: str
    proof_image_url: str

class VerificationResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: str
    draw_id: str
    proof_image_url: str
    status: str
    admin_notes: Optional[str] = None
    created_at: datetime

class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    subscription_status: Optional[str] = None
    subscription_tier: Optional[str] = None
    subscription_end_date: Optional[datetime] = None

class AdminStatsResponse(BaseModel):
    total_users: int
    active_subscribers: int
    total_prize_pool: float
    total_charity_contributions: float
    total_draws: int

class CheckoutRequest(BaseModel):
    tier: str
    origin_url: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# ============ UTILITY FUNCTIONS ============

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])}, {"password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = str(user["_id"])
        del user["_id"]
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def send_email(recipient_email: str, subject: str, html_content: str):
    if not resend.api_key or resend.api_key == "re_placeholder_key":
        logger.warning(f"Resend API key not configured. Email not sent to {recipient_email}")
        return
    params = {
        "from": SENDER_EMAIL,
        "to": [recipient_email],
        "subject": subject,
        "html": html_content
    }
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {recipient_email}: {email.get('id')}")
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")

# ============ STARTUP & SEEDING ============

@app.on_event("startup")
async def startup_event():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.login_attempts.create_index("identifier")
    await db.scores.create_index("user_id")
    await db.charities.create_index("featured")
    await db.draws.create_index("draw_date")
    
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@golfcharity.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@2024!")
    existing_admin = await db.users.find_one({"email": admin_email})
    
    if existing_admin is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "subscription_status": "active",
            "subscription_tier": None,
            "subscription_end_date": None,
            "selected_charity_id": None,
            "charity_contribution_percentage": 10,
            "created_at": datetime.now(timezone.utc)
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing_admin["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info(f"Admin password updated: {admin_email}")
    
    # Seed sample charities
    charity_count = await db.charities.count_documents({})
    if charity_count == 0:
        sample_charities = [
            {
                "charity_id": str(uuid.uuid4()),
                "name": "Children's Education Fund",
                "description": "Supporting education for underprivileged children worldwide. Every contribution helps provide books, uniforms, and school supplies.",
                "image_url": "https://images.unsplash.com/photo-1509099836639-18ba1795216d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTZ8MHwxfHNlYXJjaHwxfHxjaGFyaXR5JTIwaW1wYWN0JTIwc21pbGluZyUyMGNvbW11bml0eXxlbnwwfHx8fDE3NzUxMTI2NzJ8MA&ixlib=rb-4.1.0&q=85",
                "featured": True,
                "upcoming_events": ["Annual Golf Day - March 2026", "Charity Gala - June 2026"],
                "created_at": datetime.now(timezone.utc)
            },
            {
                "charity_id": str(uuid.uuid4()),
                "name": "Global Health Initiative",
                "description": "Providing medical care and health resources to communities in need. Your support saves lives.",
                "image_url": "https://images.pexels.com/photos/12102732/pexels-photo-12102732.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                "featured": False,
                "upcoming_events": ["Health Awareness Week - April 2026"],
                "created_at": datetime.now(timezone.utc)
            },
            {
                "charity_id": str(uuid.uuid4()),
                "name": "Environmental Conservation Trust",
                "description": "Protecting our planet for future generations through conservation projects and sustainable initiatives.",
                "image_url": "https://images.unsplash.com/photo-1603998382124-c9835bf50409?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTZ8MHwxfHNlYXJjaHw0fHxjaGFyaXR5JTIwaW1wYWN0JTIwc21pbGluZyUyMGNvbW11bml0eXxlbnwwfHx8fDE3NzUxMTI2NzJ8MA&ixlib=rb-4.1.0&q=85",
                "featured": False,
                "upcoming_events": [],
                "created_at": datetime.now(timezone.utc)
            },
            {
                "charity_id": str(uuid.uuid4()),
                "name": "Youth Sports Development",
                "description": "Empowering young athletes from underserved communities through sports programs, coaching, and equipment. Building character through competition.",
                "image_url": "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?crop=entropy&cs=srgb&fm=jpg&w=800&q=85",
                "featured": True,
                "upcoming_events": ["Junior Golf Championship - May 2026", "Sports Equipment Drive - July 2026"],
                "created_at": datetime.now(timezone.utc)
            },
            {
                "charity_id": str(uuid.uuid4()),
                "name": "Veterans Wellness Foundation",
                "description": "Supporting military veterans through therapeutic golf programs, mental health services, and community reintegration initiatives.",
                "image_url": "https://images.unsplash.com/photo-1560439514-4e9645039924?crop=entropy&cs=srgb&fm=jpg&w=800&q=85",
                "featured": False,
                "upcoming_events": ["Veterans Golf Tournament - November 2026"],
                "created_at": datetime.now(timezone.utc)
            },
            {
                "charity_id": str(uuid.uuid4()),
                "name": "Community Food Security",
                "description": "Fighting hunger by providing nutritious meals to families in need. Every dollar feeds a family, every subscription makes a lasting impact.",
                "image_url": "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?crop=entropy&cs=srgb&fm=jpg&w=800&q=85",
                "featured": False,
                "upcoming_events": ["Food Drive - Ongoing", "Community Kitchen Opening - August 2026"],
                "created_at": datetime.now(timezone.utc)
            }
        ]
        await db.charities.insert_many(sample_charities)
        logger.info(f"Seeded {len(sample_charities)} sample charities")
    
    # Write test credentials
    credentials_path = Path("/app/memory")
    credentials_path.mkdir(exist_ok=True)
    with open(credentials_path / "test_credentials.md", "w") as f:
        f.write("# Test Credentials\n\n")
        f.write("## Admin Account\n")
        f.write(f"- Email: {admin_email}\n")
        f.write(f"- Password: {admin_password}\n")
        f.write(f"- Role: admin\n\n")
        f.write("## Endpoints\n")
        f.write("- Register: POST /api/auth/register\n")
        f.write("- Login: POST /api/auth/login\n")
        f.write("- Dashboard: /dashboard\n")
        f.write("- Admin Panel: /admin\n")

# ============ AUTH ROUTES ============

@api_router.post("/auth/register")
async def register(request: RegisterRequest, response: Response):
    email = request.email.lower()
    
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = hash_password(request.password)
    user_doc = {
        "email": email,
        "password_hash": hashed,
        "name": request.name,
        "role": "user",
        "subscription_status": "inactive",
        "subscription_tier": None,
        "subscription_end_date": None,
        "selected_charity_id": None,
        "charity_contribution_percentage": 10,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=3600,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=604800,
        path="/"
    )
    
    return {
        "id": user_id,
        "email": email,
        "name": request.name,
        "role": "user",
        "subscription_status": "inactive"
    }

@api_router.post("/auth/login")
async def login(request: LoginRequest, response: Response, req: Request):
    email = request.email.lower()
    
    # Check brute force
    client_ip = req.client.host
    identifier = f"{client_ip}:{email}"
    attempt_doc = await db.login_attempts.find_one({"identifier": identifier})
    
    if attempt_doc and attempt_doc.get("locked_until"):
        if datetime.now(timezone.utc) < attempt_doc["locked_until"]:
            raise HTTPException(status_code=429, detail="Too many failed attempts. Please try again later.")
    
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(request.password, user["password_hash"]):
        # Increment failed attempts
        if attempt_doc:
            failed_count = attempt_doc.get("failed_count", 0) + 1
            update_doc = {"failed_count": failed_count}
            if failed_count >= 5:
                update_doc["locked_until"] = datetime.now(timezone.utc) + timedelta(minutes=15)
            await db.login_attempts.update_one(
                {"identifier": identifier},
                {"$set": update_doc}
            )
        else:
            await db.login_attempts.insert_one({
                "identifier": identifier,
                "failed_count": 1,
                "created_at": datetime.now(timezone.utc)
            })
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Clear failed attempts
    await db.login_attempts.delete_one({"identifier": identifier})
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=3600,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=604800,
        path="/"
    )
    
    return {
        "id": user_id,
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "subscription_status": user.get("subscription_status", "inactive"),
        "subscription_tier": user.get("subscription_tier"),
        "subscription_end_date": user.get("subscription_end_date"),
        "selected_charity_id": user.get("selected_charity_id"),
        "charity_contribution_percentage": user.get("charity_contribution_percentage", 10)
    }

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user_id = str(user["_id"])
        new_access_token = create_access_token(user_id, user["email"])
        
        response.set_cookie(
            key="access_token",
            value=new_access_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=3600,
            path="/"
        )
        
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    email = request.email.lower()
    user = await db.users.find_one({"email": email})
    
    if not user:
        # Don't reveal if email exists
        return {"message": "If the email exists, a reset link has been sent"}
    
    token = secrets.token_urlsafe(32)
    await db.password_reset_tokens.insert_one({
        "token": token,
        "email": email,
        "used": False,
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
        "created_at": datetime.now(timezone.utc)
    })
    
    # In production, send email. For now, log it
    reset_link = f"http://localhost:3000/reset-password?token={token}"
    logger.info(f"Password reset link for {email}: {reset_link}")
    
    return {"message": "If the email exists, a reset link has been sent"}

@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    token_doc = await db.password_reset_tokens.find_one({"token": request.token})
    
    if not token_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    if token_doc.get("used"):
        raise HTTPException(status_code=400, detail="Token already used")
    
    if datetime.now(timezone.utc) > token_doc["expires_at"]:
        raise HTTPException(status_code=400, detail="Token expired")
    
    hashed = hash_password(request.new_password)
    await db.users.update_one(
        {"email": token_doc["email"]},
        {"$set": {"password_hash": hashed}}
    )
    
    await db.password_reset_tokens.update_one(
        {"token": request.token},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password reset successfully"}

# ============ SUBSCRIPTION ROUTES ============

@api_router.post("/subscription/create-checkout")
async def create_subscription_checkout(request_data: CheckoutRequest, req: Request):
    user = await get_current_user(req)
    
    if request_data.tier not in SUBSCRIPTION_PRICES:
        raise HTTPException(status_code=400, detail="Invalid subscription tier")
    
    amount = SUBSCRIPTION_PRICES[request_data.tier]
    
    # Create Stripe checkout
    host_url = request_data.origin_url
    webhook_url = f"{os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{host_url}/dashboard?session_id={{{{CHECKOUT_SESSION_ID}}}}"
    cancel_url = f"{host_url}/dashboard"
    
    checkout_request = CheckoutSessionRequest(
        amount=amount,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["id"],
            "tier": request_data.tier,
            "type": "subscription"
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create pending payment transaction
    await db.payment_transactions.insert_one({
        "session_id": session.session_id,
        "user_id": user["id"],
        "amount": amount,
        "currency": "usd",
        "payment_status": "pending",
        "subscription_tier": request_data.tier,
        "metadata": {"type": "subscription"},
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/subscription/checkout-status/{session_id}")
async def get_checkout_status(session_id: str, req: Request):
    user = await get_current_user(req)
    
    webhook_url = f"{os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction in database
    transaction = await db.payment_transactions.find_one({"session_id": session_id})
    
    if transaction and status.payment_status == "paid" and transaction["payment_status"] != "paid":
        # Mark as paid and update user subscription
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc)}}
        )
        
        tier = transaction["subscription_tier"]
        end_date = datetime.now(timezone.utc)
        if tier == "monthly":
            end_date += timedelta(days=30)
        else:  # yearly
            end_date += timedelta(days=365)
        
        await db.users.update_one(
            {"_id": ObjectId(user["id"])},
            {"$set": {
                "subscription_status": "active",
                "subscription_tier": tier,
                "subscription_end_date": end_date
            }}
        )
        
        # Send welcome email
        html = f"<h1>Welcome to Golf Charity Platform!</h1><p>Your {tier} subscription is now active. You can now enter scores and participate in monthly draws.</p>"
        await send_email(user["email"], "Subscription Activated", html)
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    webhook_url = f"{os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        logger.info(f"Stripe webhook received: {webhook_response.event_type}")
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Stripe webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/subscription/status")
async def get_subscription_status(request: Request):
    user = await get_current_user(request)
    return {
        "status": user.get("subscription_status", "inactive"),
        "tier": user.get("subscription_tier"),
        "end_date": user.get("subscription_end_date")
    }

# ============ SCORE ROUTES ============

@api_router.post("/scores")
async def create_score(score: ScoreCreate, request: Request):
    user = await get_current_user(request)
    
    # Check if user has active subscription
    if user.get("subscription_status") != "active":
        raise HTTPException(status_code=403, detail="Active subscription required")
    
    # Check current score count
    score_count = await db.scores.count_documents({"user_id": user["id"]})
    
    if score_count >= 5:
        # Delete oldest score
        oldest = await db.scores.find_one(
            {"user_id": user["id"]},
            sort=[("created_at", 1)]
        )
        if oldest:
            await db.scores.delete_one({"_id": oldest["_id"]})
    
    # Create new score
    score_doc = {
        "score_id": str(uuid.uuid4()),
        "user_id": user["id"],
        "score_value": score.score_value,
        "score_date": score.score_date,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.scores.insert_one(score_doc)
    
    return {
        "id": score_doc["score_id"],
        "user_id": user["id"],
        "score_value": score.score_value,
        "score_date": score.score_date,
        "created_at": score_doc["created_at"]
    }

@api_router.get("/scores")
async def get_scores(request: Request):
    user = await get_current_user(request)
    
    scores = await db.scores.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(5)
    
    return scores

@api_router.delete("/scores/{score_id}")
async def delete_score(score_id: str, request: Request):
    user = await get_current_user(request)
    
    result = await db.scores.delete_one({"score_id": score_id, "user_id": user["id"]})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Score not found")
    
    return {"message": "Score deleted successfully"}

# ============ CHARITY ROUTES ============

@api_router.get("/charities")
async def get_charities(featured: Optional[bool] = None):
    query = {}
    if featured is not None:
        query["featured"] = featured
    
    charities = await db.charities.find(query, {"_id": 0}).to_list(100)
    
    for charity in charities:
        charity["id"] = charity["charity_id"]
    
    return charities

@api_router.get("/charities/{charity_id}")
async def get_charity(charity_id: str):
    charity = await db.charities.find_one({"charity_id": charity_id}, {"_id": 0})
    
    if not charity:
        raise HTTPException(status_code=404, detail="Charity not found")
    
    charity["id"] = charity["charity_id"]
    return charity

@api_router.post("/charities")
async def create_charity(charity: CharityCreate, request: Request):
    await get_admin_user(request)
    
    charity_doc = {
        "charity_id": str(uuid.uuid4()),
        "name": charity.name,
        "description": charity.description,
        "image_url": charity.image_url,
        "featured": charity.featured,
        "upcoming_events": charity.upcoming_events or [],
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.charities.insert_one(charity_doc)
    
    return {"id": charity_doc["charity_id"], **charity.model_dump()}

@api_router.put("/charities/{charity_id}")
async def update_charity(charity_id: str, charity: CharityCreate, request: Request):
    await get_admin_user(request)
    
    result = await db.charities.update_one(
        {"charity_id": charity_id},
        {"$set": charity.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Charity not found")
    
    return {"message": "Charity updated successfully"}

@api_router.delete("/charities/{charity_id}")
async def delete_charity(charity_id: str, request: Request):
    await get_admin_user(request)
    
    result = await db.charities.delete_one({"charity_id": charity_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Charity not found")
    
    return {"message": "Charity deleted successfully"}

@api_router.post("/user/select-charity")
async def select_charity(data: SelectCharityRequest, request: Request):
    user = await get_current_user(request)
    
    charity = await db.charities.find_one({"charity_id": data.charity_id})
    if not charity:
        raise HTTPException(status_code=404, detail="Charity not found")
    
    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": {"selected_charity_id": data.charity_id}}
    )
    
    return {"message": "Charity selected successfully"}

@api_router.put("/user/charity-contribution")
async def update_contribution(data: UpdateContributionRequest, request: Request):
    user = await get_current_user(request)
    
    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": {"charity_contribution_percentage": data.percentage}}
    )
    
    return {"message": "Contribution percentage updated successfully"}

# ============ DRAW ROUTES ============

@api_router.get("/draws/current")
async def get_current_draw():
    draw = await db.draws.find_one(
        {"status": "published"},
        {"_id": 0},
        sort=[("draw_date", -1)]
    )
    
    if not draw:
        return None
    
    draw["id"] = draw["draw_id"]
    return draw

@api_router.get("/draws/history")
async def get_draw_history():
    draws = await db.draws.find(
        {"status": "published"},
        {"_id": 0}
    ).sort("draw_date", -1).to_list(12)
    
    for draw in draws:
        draw["id"] = draw["draw_id"]
    
    return draws

@api_router.post("/draws/simulate")
async def simulate_draw(request: Request):
    await get_admin_user(request)
    
    # Generate 5 random numbers (1-45)
    draw_numbers = sorted(random.sample(range(1, 46), 5))
    
    # Calculate active subscribers
    active_subscribers = await db.users.count_documents({"subscription_status": "active"})
    
    # Calculate prize pool (assume $10 per subscriber goes to prize pool)
    prize_pool_total = active_subscribers * 10.0
    prize_pool_5 = prize_pool_total * 0.40
    prize_pool_4 = prize_pool_total * 0.35
    prize_pool_3 = prize_pool_total * 0.25
    
    # Simulate matching (for demo purposes)
    winners_5 = 0
    winners_4 = random.randint(0, 3)
    winners_3 = random.randint(1, 10)
    
    return {
        "draw_numbers": draw_numbers,
        "prize_pool_total": prize_pool_total,
        "prize_pool_5_match": prize_pool_5,
        "prize_pool_4_match": prize_pool_4,
        "prize_pool_3_match": prize_pool_3,
        "estimated_winners_5": winners_5,
        "estimated_winners_4": winners_4,
        "estimated_winners_3": winners_3,
        "active_subscribers": active_subscribers
    }

@api_router.post("/draws/publish")
async def publish_draw(draw_data: dict, request: Request):
    await get_admin_user(request)
    
    draw_doc = {
        "draw_id": str(uuid.uuid4()),
        "draw_date": datetime.now(timezone.utc),
        "draw_numbers": draw_data["draw_numbers"],
        "status": "published",
        "prize_pool_total": draw_data["prize_pool_total"],
        "prize_pool_5_match": draw_data["prize_pool_5_match"],
        "prize_pool_4_match": draw_data["prize_pool_4_match"],
        "prize_pool_3_match": draw_data["prize_pool_3_match"],
        "winners_5_match": 0,
        "winners_4_match": 0,
        "winners_3_match": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.draws.insert_one(draw_doc)
    
    # Calculate winners based on user scores
    users = await db.users.find({"subscription_status": "active"}).to_list(1000)
    
    for user in users:
        user_id = str(user["_id"])
        user_scores = await db.scores.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(5).to_list(5)
        
        if len(user_scores) == 5:
            user_numbers = sorted([s["score_value"] for s in user_scores])
            matched = len(set(user_numbers) & set(draw_data["draw_numbers"]))
            
            if matched >= 3:
                # Create participation record
                await db.participations.insert_one({
                    "participation_id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "draw_id": draw_doc["draw_id"],
                    "user_numbers": user_numbers,
                    "matched_count": matched,
                    "won": True,
                    "verified": False,
                    "payment_status": "pending",
                    "created_at": datetime.now(timezone.utc)
                })
                
                # Update winner count
                if matched == 5:
                    draw_doc["winners_5_match"] += 1
                elif matched == 4:
                    draw_doc["winners_4_match"] += 1
                elif matched == 3:
                    draw_doc["winners_3_match"] += 1
    
    # Update draw with winner counts
    await db.draws.update_one(
        {"draw_id": draw_doc["draw_id"]},
        {"$set": {
            "winners_5_match": draw_doc["winners_5_match"],
            "winners_4_match": draw_doc["winners_4_match"],
            "winners_3_match": draw_doc["winners_3_match"]
        }}
    )
    
    return {"message": "Draw published successfully", "draw_id": draw_doc["draw_id"]}

@api_router.get("/draws/{draw_id}/winners")
async def get_draw_winners(draw_id: str):
    participations = await db.participations.find(
        {"draw_id": draw_id, "won": True},
        {"_id": 0}
    ).to_list(100)
    
    # Enrich with user data
    for p in participations:
        user = await db.users.find_one({"_id": ObjectId(p["user_id"])}, {"_id": 0, "password_hash": 0})
        if user:
            p["user_name"] = user.get("name", "Unknown")
            p["user_email"] = user.get("email", "")
    
    return participations

# ============ VERIFICATION ROUTES ============

@api_router.post("/verification/upload-proof")
async def upload_verification_proof(data: VerificationUpload, request: Request):
    user = await get_current_user(request)
    
    # Check if user won this draw
    participation = await db.participations.find_one({
        "user_id": user["id"],
        "draw_id": data.draw_id,
        "won": True
    })
    
    if not participation:
        raise HTTPException(status_code=404, detail="No winning entry found for this draw")
    
    # Check if already verified
    existing = await db.winner_verifications.find_one({
        "user_id": user["id"],
        "draw_id": data.draw_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Verification already submitted")
    
    verification_doc = {
        "verification_id": str(uuid.uuid4()),
        "user_id": user["id"],
        "draw_id": data.draw_id,
        "proof_image_url": data.proof_image_url,
        "status": "pending",
        "admin_notes": None,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.winner_verifications.insert_one(verification_doc)
    
    return {"message": "Verification proof uploaded successfully"}

@api_router.get("/verification/pending")
async def get_pending_verifications(request: Request):
    await get_admin_user(request)
    
    verifications = await db.winner_verifications.find(
        {"status": "pending"},
        {"_id": 0}
    ).to_list(100)
    
    # Enrich with user data
    for v in verifications:
        user = await db.users.find_one({"_id": ObjectId(v["user_id"])}, {"_id": 0, "password_hash": 0})
        if user:
            v["user_name"] = user.get("name", "Unknown")
            v["user_email"] = user.get("email", "")
    
    return verifications

@api_router.put("/verification/{verification_id}/approve")
async def approve_verification(verification_id: str, notes: Optional[str] = None, request: Request = None):
    await get_admin_user(request)
    
    result = await db.winner_verifications.update_one(
        {"verification_id": verification_id},
        {"$set": {
            "status": "approved",
            "admin_notes": notes,
            "verified_at": datetime.now(timezone.utc)
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Verification not found")
    
    # Update participation
    verification = await db.winner_verifications.find_one({"verification_id": verification_id})
    if verification:
        await db.participations.update_one(
            {"user_id": verification["user_id"], "draw_id": verification["draw_id"]},
            {"$set": {"verified": True}}
        )
    
    return {"message": "Verification approved"}

@api_router.put("/verification/{verification_id}/reject")
async def reject_verification(verification_id: str, notes: str, request: Request):
    await get_admin_user(request)
    
    result = await db.winner_verifications.update_one(
        {"verification_id": verification_id},
        {"$set": {
            "status": "rejected",
            "admin_notes": notes,
            "verified_at": datetime.now(timezone.utc)
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Verification not found")
    
    return {"message": "Verification rejected"}

# ============ ADMIN ROUTES ============

@api_router.get("/admin/users")
async def get_all_users(request: Request):
    await get_admin_user(request)
    
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    for user in users:
        user["id"] = user.get("email")  # Temporary ID
    
    return users

@api_router.put("/admin/users/{user_email}")
async def update_user(user_email: str, update_data: AdminUserUpdate, request: Request):
    await get_admin_user(request)
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.users.update_one(
        {"email": user_email},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User updated successfully"}

@api_router.get("/admin/stats")
async def get_admin_stats(request: Request):
    await get_admin_user(request)
    
    total_users = await db.users.count_documents({})
    active_subscribers = await db.users.count_documents({"subscription_status": "active"})
    total_draws = await db.draws.count_documents({"status": "published"})
    
    # Calculate total prize pool (from latest draw)
    latest_draw = await db.draws.find_one(
        {"status": "published"},
        sort=[("draw_date", -1)]
    )
    
    total_prize_pool = latest_draw.get("prize_pool_total", 0) if latest_draw else 0
    
    # Calculate charity contributions (10% of all subscription payments)
    transactions = await db.payment_transactions.find(
        {"payment_status": "paid"},
        {"_id": 0}
    ).to_list(10000)
    
    total_charity = sum(t.get("amount", 0) * 0.1 for t in transactions)
    
    return {
        "total_users": total_users,
        "active_subscribers": active_subscribers,
        "total_prize_pool": total_prize_pool,
        "total_charity_contributions": total_charity,
        "total_draws": total_draws
    }

@api_router.get("/admin/winners")
async def get_all_winners(request: Request):
    await get_admin_user(request)
    
    participations = await db.participations.find(
        {"won": True},
        {"_id": 0}
    ).to_list(1000)
    
    # Enrich with user and draw data
    for p in participations:
        user = await db.users.find_one({"_id": ObjectId(p["user_id"])}, {"_id": 0, "password_hash": 0})
        if user:
            p["user_name"] = user.get("name", "Unknown")
            p["user_email"] = user.get("email", "")
        
        draw = await db.draws.find_one({"draw_id": p["draw_id"]}, {"_id": 0})
        if draw:
            p["draw_date"] = draw.get("draw_date")
    
    return participations

@api_router.put("/admin/winners/{participation_id}/mark-paid")
async def mark_winner_paid(participation_id: str, request: Request):
    await get_admin_user(request)
    
    result = await db.participations.update_one(
        {"participation_id": participation_id},
        {"$set": {"payment_status": "paid", "paid_at": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Participation not found")
    
    return {"message": "Winner marked as paid"}

@api_router.get("/user/participations")
async def get_user_participations(request: Request):
    user = await get_current_user(request)
    
    participations = await db.participations.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Enrich with draw data
    for p in participations:
        draw = await db.draws.find_one({"draw_id": p["draw_id"]}, {"_id": 0})
        if draw:
            p["draw_date"] = draw.get("draw_date")
            p["draw_numbers"] = draw.get("draw_numbers")
            
            # Calculate prize based on match count
            if p.get("won"):
                match_count = p.get("matched_count", 0)
                if match_count == 5:
                    # Get number of 5-match winners to split prize
                    winners_count = draw.get("winners_5_match", 1)
                    p["prize_amount"] = draw.get("prize_pool_5_match", 0) / winners_count if winners_count > 0 else 0
                elif match_count == 4:
                    winners_count = draw.get("winners_4_match", 1)
                    p["prize_amount"] = draw.get("prize_pool_4_match", 0) / winners_count if winners_count > 0 else 0
                elif match_count == 3:
                    winners_count = draw.get("winners_3_match", 1)
                    p["prize_amount"] = draw.get("prize_pool_3_match", 0) / winners_count if winners_count > 0 else 0
    
    return participations

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
