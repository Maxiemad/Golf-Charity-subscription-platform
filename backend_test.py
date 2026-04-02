import requests
import sys
import json
from datetime import datetime
import uuid

class GolfCharityAPITester:
    def __init__(self, base_url="https://score-for-good-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.admin_token = None
        self.user_token = None
        self.test_user_id = None
        self.test_charity_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append(f"{name}: {details}")

    def test_api_endpoint(self, name, method, endpoint, expected_status, data=None, headers=None, cookies=None):
        """Generic API test method"""
        url = f"{self.base_url}/api/{endpoint}"
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers, cookies=cookies)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers, cookies=cookies)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers, cookies=cookies)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers, cookies=cookies)
            
            success = response.status_code == expected_status
            details = f"Expected {expected_status}, got {response.status_code}"
            if not success and response.text:
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', response.text[:100])}"
                except:
                    details += f" - {response.text[:100]}"
            
            self.log_test(name, success, details if not success else "")
            return success, response.json() if success and response.text else {}
            
        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        print("\n🔐 Testing Admin Authentication...")
        success, response = self.test_api_endpoint(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@golfcharity.com", "password": "Admin@2024!"}
        )
        
        if success:
            # Check if cookies are set (httpOnly cookies won't be in response)
            if self.session.cookies:
                print("   Admin cookies set successfully")
            return True
        return False

    def test_user_registration_and_login(self):
        """Test user registration and login"""
        print("\n👤 Testing User Registration & Login...")
        
        # Generate unique test user
        timestamp = datetime.now().strftime("%H%M%S")
        test_email = f"testuser_{timestamp}@example.com"
        test_password = "TestPass123!"
        test_name = f"Test User {timestamp}"
        
        # Test registration
        success, response = self.test_api_endpoint(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={"email": test_email, "password": test_password, "name": test_name}
        )
        
        if success:
            self.test_user_id = response.get('id')
            print(f"   User registered with ID: {self.test_user_id}")
            
            # Test logout
            self.test_api_endpoint("User Logout", "POST", "auth/logout", 200)
            
            # Test login
            success, response = self.test_api_endpoint(
                "User Login",
                "POST",
                "auth/login",
                200,
                data={"email": test_email, "password": test_password}
            )
            
            if success:
                print(f"   User login successful")
                return True
        
        return False

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔑 Testing Auth Endpoints...")
        
        # Test /me endpoint
        self.test_api_endpoint("Get Current User", "GET", "auth/me", 200)
        
        # Test refresh token
        self.test_api_endpoint("Refresh Token", "POST", "auth/refresh", 200)

    def test_charity_endpoints(self):
        """Test charity-related endpoints"""
        print("\n❤️ Testing Charity Endpoints...")
        
        # Get all charities
        success, response = self.test_api_endpoint("Get All Charities", "GET", "charities", 200)
        
        if success and response:
            charities = response
            if charities:
                self.test_charity_id = charities[0].get('id') or charities[0].get('charity_id')
                print(f"   Found {len(charities)} charities")
                
                # Test get specific charity
                if self.test_charity_id:
                    self.test_api_endpoint(
                        "Get Specific Charity",
                        "GET",
                        f"charities/{self.test_charity_id}",
                        200
                    )
                    
                    # Test select charity (requires user login)
                    self.test_api_endpoint(
                        "Select Charity",
                        "POST",
                        "user/select-charity",
                        200,
                        data={"charity_id": self.test_charity_id}
                    )
                    
                    # Test update contribution percentage
                    self.test_api_endpoint(
                        "Update Charity Contribution",
                        "PUT",
                        "user/charity-contribution",
                        200,
                        data={"percentage": 15}
                    )

    def test_subscription_endpoints(self):
        """Test subscription-related endpoints"""
        print("\n💳 Testing Subscription Endpoints...")
        
        # Test subscription status
        self.test_api_endpoint("Get Subscription Status", "GET", "subscription/status", 200)
        
        # Test create checkout (this will create a Stripe session but won't complete payment)
        self.test_api_endpoint(
            "Create Checkout Session",
            "POST",
            "subscription/create-checkout",
            200,
            data={"tier": "monthly", "origin_url": "https://score-for-good-1.preview.emergentagent.com"}
        )

    def test_score_endpoints(self):
        """Test score-related endpoints"""
        print("\n⛳ Testing Score Endpoints...")
        
        # Test get scores (should work even without active subscription)
        self.test_api_endpoint("Get User Scores", "GET", "scores", 200)
        
        # Test add score (requires active subscription - will likely fail)
        self.test_api_endpoint(
            "Add Score (No Subscription)",
            "POST",
            "scores",
            403,  # Expecting 403 since user doesn't have active subscription
            data={"score_value": 35, "score_date": "2024-01-15"}
        )

    def test_draw_endpoints(self):
        """Test draw-related endpoints"""
        print("\n🎯 Testing Draw Endpoints...")
        
        # Test get current draw
        self.test_api_endpoint("Get Current Draw", "GET", "draws/current", 200)
        
        # Test get draw history
        self.test_api_endpoint("Get Draw History", "GET", "draws/history", 200)
        
        # Test user participations
        self.test_api_endpoint("Get User Participations", "GET", "user/participations", 200)

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        print("\n👑 Testing Admin Endpoints...")
        
        # First login as admin
        admin_success = self.test_admin_login()
        
        if admin_success:
            # Test admin stats
            self.test_api_endpoint("Get Admin Stats", "GET", "admin/stats", 200)
            
            # Test get all users
            self.test_api_endpoint("Get All Users", "GET", "admin/users", 200)
            
            # Test get all winners
            self.test_api_endpoint("Get All Winners", "GET", "admin/winners", 200)
            
            # Test simulate draw
            success, response = self.test_api_endpoint("Simulate Draw", "POST", "draws/simulate", 200)
            
            if success and response:
                print("   Draw simulation successful")
                
                # Test publish draw (using simulation result)
                self.test_api_endpoint(
                    "Publish Draw",
                    "POST",
                    "draws/publish",
                    200,
                    data=response
                )
            
            # Test pending verifications
            self.test_api_endpoint("Get Pending Verifications", "GET", "verification/pending", 200)

    def test_error_cases(self):
        """Test error handling"""
        print("\n🚫 Testing Error Cases...")
        
        # Test invalid login
        self.test_api_endpoint(
            "Invalid Login",
            "POST",
            "auth/login",
            401,
            data={"email": "invalid@example.com", "password": "wrongpassword"}
        )
        
        # Test duplicate registration
        self.test_api_endpoint(
            "Duplicate Registration",
            "POST",
            "auth/register",
            400,
            data={"email": "admin@golfcharity.com", "password": "test123", "name": "Test"}
        )
        
        # Test invalid charity ID
        self.test_api_endpoint(
            "Invalid Charity ID",
            "GET",
            "charities/invalid-id",
            404
        )

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Golf Charity Platform API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test user registration and login first
        user_auth_success = self.test_user_registration_and_login()
        
        if user_auth_success:
            # Test user endpoints
            self.test_auth_endpoints()
            self.test_charity_endpoints()
            self.test_subscription_endpoints()
            self.test_score_endpoints()
            self.test_draw_endpoints()
        
        # Test admin endpoints
        self.test_admin_endpoints()
        
        # Test error cases
        self.test_error_cases()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"   • {failure}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n✨ Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 80  # Consider 80%+ success rate as passing

def main():
    tester = GolfCharityAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())