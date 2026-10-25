from django.db import migrations


def assign_existing_expenses(apps, schema_editor):
    Expense = apps.get_model("expenses", "Expense")
    User = apps.get_model("auth", "User")

    # If there are no unassigned expenses, nothing needs to be done.
    if not Expense.objects.filter(user__isnull=True).exists():
        return

    # Look for the previous account without requiring it to exist.
    user = User.objects.filter(username="Megha").first()

    # A fresh database may not contain the previous account.
    if user is None:
        return

    # Assign existing unowned expenses to Megha.
    Expense.objects.filter(user__isnull=True).update(user_id=user.id)


class Migration(migrations.Migration):
    dependencies = [
        ("expenses", "0002_expense_user"),
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.RunPython(
            assign_existing_expenses,
            migrations.RunPython.noop,
        ),
    ]