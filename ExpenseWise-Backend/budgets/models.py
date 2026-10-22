from django.db import models
from django.contrib.auth.models import User
from categories.models import Category


class Budget(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="budgets",
        null=True,
        blank=True
    )

    name = models.CharField(max_length=100)

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="budgets"
    )

    monthly_limit = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    month = models.PositiveSmallIntegerField()
    year = models.PositiveSmallIntegerField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "category", "month", "year"],
                name="unique_user_category_monthly_budget"
            ),
            models.CheckConstraint(
                condition=models.Q(month__gte=1, month__lte=12),
                name="valid_budget_month"
            ),
            models.CheckConstraint(
                condition=models.Q(monthly_limit__gt=0),
                name="positive_monthly_budget"
            ),
        ]

    def __str__(self):
        return f"{self.name} - {self.month}/{self.year}"