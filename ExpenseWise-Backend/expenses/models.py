from django.db import models
from django.contrib.auth.models import User
from categories.models import Category


class Expense(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="expenses",
        null=True,
        blank=True
    )

    title = models.CharField(max_length=200)

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="expenses"
    )

    date = models.DateField()

    description = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title