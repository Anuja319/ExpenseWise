from rest_framework import serializers
from .models import Budget
from categories.models import Category


class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = [
            "id",
            "name",
            "category",
            "monthly_limit",
            "month",
            "year",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_monthly_limit(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Monthly budget must be greater than zero."
            )
        return value

    def validate_month(self, value):
        if not 1 <= value <= 12:
            raise serializers.ValidationError(
                "Month must be between 1 and 12."
            )
        return value

    def validate_category(self, value):
        request = self.context.get("request")

        if request and value.user_id != request.user.id:
            raise serializers.ValidationError(
                "You can only select your own categories."
            )

        return value