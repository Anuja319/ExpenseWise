from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token


class AuthenticationTests(APITestCase):

    def setUp(self):
        self.register_url = "/api/accounts/register/"
        self.login_url = "/api/accounts/login/"
        self.logout_url = "/api/accounts/logout/"
        self.categories_url = "/api/categories/"

        self.user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "StrongPassword!2026#"
        }

    def test_user_registration(self):
        response = self.client.post(
            self.register_url,
            self.user_data,
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            User.objects.filter(username="testuser").exists()
        )
        self.assertIn("token", response.data)

    def test_duplicate_email_registration(self):
        User.objects.create_user(
            username="existinguser",
            email="test@example.com",
            password="StrongPassword!2026#"
        )

        response = self.client.post(
            self.register_url,
            self.user_data,
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_login(self):
        User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password=self.user_data["password"]
        )

        response = self.client.post(
            self.login_url,
            {
                "username": "testuser",
                "password": self.user_data["password"]
            },
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)

    def test_invalid_login(self):
        response = self.client.post(
            self.login_url,
            {
                "username": "wronguser",
                "password": "wrongpassword"
            },
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_protected_endpoint_without_token(self):
        response = self.client.get(self.categories_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_protected_endpoint_with_token(self):
        user = User.objects.create_user(
            username="testuser",
            password=self.user_data["password"]
        )

        token = Token.objects.create(user=user)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Token {token.key}"
        )

        response = self.client.get(self.categories_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_logout_invalidates_token(self):
        user = User.objects.create_user(
            username="testuser",
            password=self.user_data["password"]
        )

        token = Token.objects.create(user=user)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Token {token.key}"
        )

        logout_response = self.client.post(self.logout_url)

        self.assertEqual(
            logout_response.status_code,
            status.HTTP_200_OK
        )

        self.assertFalse(
            Token.objects.filter(user=user).exists()
        )

        protected_response = self.client.get(self.categories_url)

        self.assertEqual(
            protected_response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )