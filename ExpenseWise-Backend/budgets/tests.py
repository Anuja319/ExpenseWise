from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from categories.models import Category
from budgets.models import Budget


class BudgetCRUDTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="budgetuser",
            password="StrongPassword!2026#"
        )

        self.other_user = User.objects.create_user(
            username="otherbudgetuser",
            password="StrongPassword!2026#"
        )

        self.category = Category.objects.create(
            user=self.user,
            name="Food"
        )

        self.other_category = Category.objects.create(
            user=self.other_user,
            name="Travel"
        )

        self.client.force_authenticate(user=self.user)

        self.url = "/api/budgets/"

        self.budget_data = {
            "name": "Food Budget",
            "category": self.category.id,
            "monthly_limit": "5000.00",
            "month": 11,
            "year": 2026
        }

    def test_create_budget(self):
        response = self.client.post(
            self.url,
            self.budget_data,
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertEqual(
            Budget.objects.get().user,
            self.user
        )

    def test_list_only_own_budgets(self):
        Budget.objects.create(
            user=self.user,
            name="Food Budget",
            category=self.category,
            monthly_limit=5000,
            month=11,
            year=2026
        )

        Budget.objects.create(
            user=self.other_user,
            name="Travel Budget",
            category=self.other_category,
            monthly_limit=3000,
            month=11,
            year=2026
        )

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Food Budget")

    def test_retrieve_own_budget(self):
        budget = Budget.objects.create(
            user=self.user,
            name="Food Budget",
            category=self.category,
            monthly_limit=5000,
            month=11,
            year=2026
        )

        response = self.client.get(f"{self.url}{budget.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_budget(self):
        budget = Budget.objects.create(
            user=self.user,
            name="Food Budget",
            category=self.category,
            monthly_limit=5000,
            month=11,
            year=2026
        )

        response = self.client.patch(
            f"{self.url}{budget.id}/",
            {"monthly_limit": "6000.00"},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        budget.refresh_from_db()
        self.assertEqual(budget.monthly_limit, 6000)

    def test_delete_budget(self):
        budget = Budget.objects.create(
            user=self.user,
            name="Food Budget",
            category=self.category,
            monthly_limit=5000,
            month=11,
            year=2026
        )

        response = self.client.delete(f"{self.url}{budget.id}/")

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT
        )

        self.assertFalse(
            Budget.objects.filter(id=budget.id).exists()
        )

    def test_cannot_access_other_users_budget(self):
        budget = Budget.objects.create(
            user=self.other_user,
            name="Travel Budget",
            category=self.other_category,
            monthly_limit=3000,
            month=11,
            year=2026
        )

        response = self.client.get(f"{self.url}{budget.id}/")

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_cannot_use_other_users_category(self):
        data = {
            **self.budget_data,
            "category": self.other_category.id
        }

        response = self.client.post(
            self.url,
            data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_reject_invalid_month(self):
        data = {
            **self.budget_data,
            "month": 13
        }

        response = self.client.post(
            self.url,
            data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_reject_zero_monthly_limit(self):
        data = {
            **self.budget_data,
            "monthly_limit": "0"
        }

        response = self.client.post(
            self.url,
            data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )