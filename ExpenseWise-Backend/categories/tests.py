from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from categories.models import Category


class CategoryCRUDTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="categoryuser",
            password="StrongPassword!2026#"
        )

        self.other_user = User.objects.create_user(
            username="othercategoryuser",
            password="StrongPassword!2026#"
        )

        self.client.force_authenticate(user=self.user)

        self.url = "/api/categories/"

        self.category_data = {
            "name": "Food",
            "description": "Food expenses"
        }

    def test_create_category(self):
        response = self.client.post(
            self.url,
            self.category_data,
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertEqual(
            Category.objects.get().user,
            self.user
        )

    def test_list_only_own_categories(self):
        Category.objects.create(user=self.user, name="Food")
        Category.objects.create(user=self.other_user, name="Travel")

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Food")

    def test_retrieve_own_category(self):
        category = Category.objects.create(
            user=self.user,
            name="Food"
        )

        response = self.client.get(f"{self.url}{category.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_category(self):
        category = Category.objects.create(
            user=self.user,
            name="Food"
        )

        response = self.client.patch(
            f"{self.url}{category.id}/",
            {"name": "Groceries"},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        category.refresh_from_db()
        self.assertEqual(category.name, "Groceries")

    def test_delete_category(self):
        category = Category.objects.create(
            user=self.user,
            name="Food"
        )

        response = self.client.delete(f"{self.url}{category.id}/")

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT
        )

        self.assertFalse(
            Category.objects.filter(id=category.id).exists()
        )

    def test_duplicate_category_name(self):
        Category.objects.create(
            user=self.user,
            name="Food"
        )

        response = self.client.post(
            self.url,
            self.category_data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )