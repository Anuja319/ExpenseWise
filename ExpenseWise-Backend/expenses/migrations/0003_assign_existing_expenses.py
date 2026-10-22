from django.db import migrations


def assign_expenses(apps, schema_editor):
    Expense = apps.get_model("expenses", "Expense")
    Category = apps.get_model("categories", "Category")
    User = apps.get_model("auth", "User")

    megha = User.objects.get(username="Megha")
    expenseuser1 = User.objects.get(username="expenseuser1")

    # Preserve expenseuser1's existing Food expenses
    food = Category.objects.get(user_id=megha.id, name="Food")

    other_food, _ = Category.objects.get_or_create(
        user_id=expenseuser1.id,
        name="Food",
        defaults={"description": "Daily food expenses"},
    )

    Expense.objects.filter(
        user_id=expenseuser1.id,
        category_id=food.id,
    ).update(category_id=other_food.id)

    # Assign only unowned expenses to Megha
    Expense.objects.filter(user__isnull=True).update(user_id=megha.id)


class Migration(migrations.Migration):
    dependencies = [
        ("expenses", "0002_expense_user"),
        ("categories", "0003_assign_existing_categories"),
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.RunPython(assign_expenses, migrations.RunPython.noop),
    ]