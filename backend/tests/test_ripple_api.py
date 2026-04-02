"""
Backend API Tests for Ripple Golf Charity Platform
Tests: Auth, Charities, User Charity Selection, Theme-related endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://score-for-good-1.preview.emergentagent.com')

class TestHealthAndAuth:
    """Authentication and basic health tests"""
    
    def test_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@golfcharity.com", "password": "Admin@2024!"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["email"] == "admin@golfcharity.com"
        assert data["role"] == "admin"
        print(f"✅ Login successful: {data['email']}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@email.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        print("✅ Invalid credentials rejected correctly")
    
    def test_get_me_without_auth(self):
        """Test /auth/me without authentication"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✅ Unauthenticated request rejected correctly")


class TestCharities:
    """Charity-related endpoint tests"""
    
    def test_get_all_charities(self):
        """Test fetching all charities"""
        response = requests.get(f"{BASE_URL}/api/charities")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 6  # Should have 6 seeded charities
        print(f"✅ Retrieved {len(data)} charities")
        
        # Verify charity structure
        for charity in data:
            assert "id" in charity
            assert "name" in charity
            assert "description" in charity
            assert "image_url" in charity
            assert "featured" in charity
        
        # Print charity names
        charity_names = [c["name"] for c in data]
        print(f"Charities: {charity_names}")
    
    def test_get_featured_charities(self):
        """Test fetching featured charities only"""
        response = requests.get(f"{BASE_URL}/api/charities?featured=true")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned charities should be featured
        for charity in data:
            assert charity["featured"] == True
        print(f"✅ Retrieved {len(data)} featured charities")
    
    def test_get_single_charity(self):
        """Test fetching a single charity by ID"""
        # First get all charities
        all_response = requests.get(f"{BASE_URL}/api/charities")
        charities = all_response.json()
        
        if charities:
            charity_id = charities[0]["charity_id"]
            response = requests.get(f"{BASE_URL}/api/charities/{charity_id}")
            assert response.status_code == 200
            data = response.json()
            assert data["charity_id"] == charity_id
            print(f"✅ Retrieved single charity: {data['name']}")
    
    def test_get_nonexistent_charity(self):
        """Test fetching a charity that doesn't exist"""
        response = requests.get(f"{BASE_URL}/api/charities/nonexistent-id-12345")
        assert response.status_code == 404
        print("✅ Nonexistent charity returns 404")


class TestUserCharitySelection:
    """Tests for user charity selection functionality"""
    
    @pytest.fixture
    def auth_session(self):
        """Create authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@golfcharity.com", "password": "Admin@2024!"}
        )
        assert response.status_code == 200
        return session
    
    def test_select_charity(self, auth_session):
        """Test selecting a charity for user"""
        # Get available charities
        charities_response = auth_session.get(f"{BASE_URL}/api/charities")
        charities = charities_response.json()
        
        if charities:
            charity_id = charities[0]["charity_id"]
            charity_name = charities[0]["name"]
            
            # Select the charity
            response = auth_session.post(
                f"{BASE_URL}/api/user/select-charity",
                json={"charity_id": charity_id}
            )
            assert response.status_code == 200
            print(f"✅ Selected charity: {charity_name}")
            
            # Verify selection via /auth/me
            me_response = auth_session.get(f"{BASE_URL}/api/auth/me")
            assert me_response.status_code == 200
            user_data = me_response.json()
            assert user_data["selected_charity_id"] == charity_id
            print(f"✅ Verified charity selection in user profile")
    
    def test_select_nonexistent_charity(self, auth_session):
        """Test selecting a charity that doesn't exist"""
        response = auth_session.post(
            f"{BASE_URL}/api/user/select-charity",
            json={"charity_id": "nonexistent-charity-id"}
        )
        assert response.status_code == 404
        print("✅ Nonexistent charity selection rejected")
    
    def test_select_charity_without_auth(self):
        """Test selecting charity without authentication"""
        response = requests.post(
            f"{BASE_URL}/api/user/select-charity",
            json={"charity_id": "some-charity-id"}
        )
        assert response.status_code == 401
        print("✅ Unauthenticated charity selection rejected")


class TestUserProfile:
    """Tests for user profile and dashboard data"""
    
    @pytest.fixture
    def auth_session(self):
        """Create authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@golfcharity.com", "password": "Admin@2024!"}
        )
        assert response.status_code == 200
        return session
    
    def test_get_user_profile(self, auth_session):
        """Test getting user profile with charity info"""
        response = auth_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        
        # Verify user profile structure
        assert "id" in data
        assert "email" in data
        assert "name" in data
        assert "role" in data
        assert "subscription_status" in data
        assert "selected_charity_id" in data
        assert "charity_contribution_percentage" in data
        
        print(f"✅ User profile retrieved: {data['email']}")
        print(f"   - Subscription: {data['subscription_status']}")
        print(f"   - Selected Charity ID: {data['selected_charity_id']}")
        print(f"   - Contribution %: {data['charity_contribution_percentage']}")
    
    def test_update_contribution_percentage(self, auth_session):
        """Test updating charity contribution percentage"""
        response = auth_session.put(
            f"{BASE_URL}/api/user/charity-contribution",
            json={"percentage": 15}
        )
        assert response.status_code == 200
        
        # Verify update
        me_response = auth_session.get(f"{BASE_URL}/api/auth/me")
        user_data = me_response.json()
        assert user_data["charity_contribution_percentage"] == 15
        print("✅ Contribution percentage updated to 15%")
        
        # Reset to 10%
        auth_session.put(
            f"{BASE_URL}/api/user/charity-contribution",
            json={"percentage": 10}
        )
    
    def test_invalid_contribution_percentage(self, auth_session):
        """Test setting invalid contribution percentage"""
        # Below minimum (10%)
        response = auth_session.put(
            f"{BASE_URL}/api/user/charity-contribution",
            json={"percentage": 5}
        )
        assert response.status_code == 422  # Validation error
        print("✅ Invalid contribution percentage (5%) rejected")


class TestSubscription:
    """Tests for subscription-related endpoints"""
    
    @pytest.fixture
    def auth_session(self):
        """Create authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@golfcharity.com", "password": "Admin@2024!"}
        )
        assert response.status_code == 200
        return session
    
    def test_get_subscription_status(self, auth_session):
        """Test getting subscription status"""
        response = auth_session.get(f"{BASE_URL}/api/subscription/status")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        print(f"✅ Subscription status: {data['status']}")
    
    def test_create_checkout_session(self, auth_session):
        """Test creating Stripe checkout session"""
        response = auth_session.post(
            f"{BASE_URL}/api/subscription/create-checkout",
            json={
                "tier": "monthly",
                "origin_url": "https://score-for-good-1.preview.emergentagent.com"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        assert "session_id" in data
        print(f"✅ Checkout session created: {data['session_id'][:20]}...")


class TestScores:
    """Tests for score-related endpoints"""
    
    @pytest.fixture
    def auth_session(self):
        """Create authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@golfcharity.com", "password": "Admin@2024!"}
        )
        assert response.status_code == 200
        return session
    
    def test_get_scores(self, auth_session):
        """Test getting user scores"""
        response = auth_session.get(f"{BASE_URL}/api/scores")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Retrieved {len(data)} scores")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
