from rest_framework import serializers
from .models import Expense
from categories.models import Category


class ExpenseSerializer(serializers.ModelSerializer):

    class Meta:
        model = Expense

        fields = [
            "id",
            "title",
            "amount",
            "category",
            "date",
            "description",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Amount must be greater than zero."
            )

        return value

    def validate_category(self, value):
        request = self.context.get("request")

        if request and value.user_id != request.user.id:
            raise serializers.ValidationError(
                "You cannot use another user's category."
            )

        return value