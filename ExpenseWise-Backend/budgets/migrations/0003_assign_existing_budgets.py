from django.db import migrations


def assign_existing_budgets(apps, schema_editor):
    Budget = apps.get_model("budgets", "Budget")
    User = apps.get_model("auth", "User")

    try:
        user = User.objects.get(username="Megha")
    except User.DoesNotExist:
        raise RuntimeError(
            "User 'Megha' was not found. "
            "Existing budget ownership was not assigned."
        )

    Budget.objects.filter(user__isnull=True).update(user_id=user.id)


class Migration(migrations.Migration):

    dependencies = [
    ("budgets", "0002_remove_budget_unique_category_monthly_budget_and_more"),
    ("categories", "0003_assign_existing_categories"),
    ("auth", "0012_alter_user_first_name_max_length"),
]

    operations = [
        migrations.RunPython(
            assign_existing_budgets,
            migrations.RunPython.noop,
        ),
    ]