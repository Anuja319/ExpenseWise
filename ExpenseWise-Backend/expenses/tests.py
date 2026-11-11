from datetime import date

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from categories.models import Category
from expenses.models import Expense


class ExpenseCRUDTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="expenseuser",
            password="StrongPassword!2026#"
        )

        self.other_user = User.objects.create_user(
            username="otheruser",
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

        self.expenses_url = "/api/expenses/"

        self.expense_data = {
            "title": "Lunch",
            "amount": "250.00",
            "category": self.category.id,
            "date": str(date.today()),
            "description": "Lunch expense"
        }

    def test_create_expense(self):
        response = self.client.post(
            self.expenses_url,
            self.expense_data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        self.assertEqual(
            Expense.objects.get().user,
            self.user
        )

    def test_list_only_own_expenses(self):
        Expense.objects.create(
            user=self.user,
            title="My Expense",
            amount=100,
            category=self.category,
            date=date.today()
        )

        Expense.objects.create(
            user=self.other_user,
            title="Other Expense",
            amount=200,
            category=self.other_category,
            date=date.today()
        )

        response = self.client.get(self.expenses_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "My Expense")

    def test_retrieve_own_expense(self):
        expense = Expense.objects.create(
            user=self.user,
            title="My Expense",
            amount=100,
            category=self.category,
            date=date.today()
        )

        response = self.client.get(
            f"{self.expenses_url}{expense.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_own_expense(self):
        expense = Expense.objects.create(
            user=self.user,
            title="Old Title",
            amount=100,
            category=self.category,
            date=date.today()
        )

        response = self.client.patch(
            f"{self.expenses_url}{expense.id}/",
            {"title": "Updated Title"},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        expense.refresh_from_db()

        self.assertEqual(expense.title, "Updated Title")

    def test_delete_own_expense(self):
        expense = Expense.objects.create(
            user=self.user,
            title="Delete Me",
            amount=100,
            category=self.category,
            date=date.today()
        )

        response = self.client.delete(
            f"{self.expenses_url}{expense.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT
        )

        self.assertFalse(
            Expense.objects.filter(id=expense.id).exists()
        )

    def test_cannot_access_other_users_expense(self):
        expense = Expense.objects.create(
            user=self.other_user,
            title="Private Expense",
            amount=300,
            category=self.other_category,
            date=date.today()
        )

        response = self.client.get(
            f"{self.expenses_url}{expense.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_cannot_use_other_users_category(self):
        response = self.client.post(
            self.expenses_url,
            {
                **self.expense_data,
                "category": self.other_category.id
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_reject_zero_or_negative_amount(self):
        for amount in ["0", "-100"]:
            data = {
                **self.expense_data,
                "amount": amount
            }

            response = self.client.post(
                self.expenses_url,
                data,
                format="json"
            )

            self.assertEqual(
                response.status_code,
                status.HTTP_400_BAD_REQUEST
            )