from django.db import models
from django.contrib.auth.models import User


class Category(models.Model):
    user = models.ForeignKey(
    User,
    on_delete=models.CASCADE,
    related_name="categories",
    null=True,
    blank=True
)

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name"],
                name="unique_category_name_per_user"
            )
        ]

    def __str__(self):
        return self.name