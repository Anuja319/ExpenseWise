from django.db import migrations


def assign_categories(apps, schema_editor):
    Category = apps.get_model("categories", "Category")
    User = apps.get_model("auth", "User")

    megha = User.objects.get(username="Megha")

    # Assign existing categories to Megha
    Category.objects.filter(user__isnull=True).update(user_id=megha.id)


class Migration(migrations.Migration):
    dependencies = [
        ("categories", "0002_category_user_alter_category_name_and_more"),
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.RunPython(assign_categories, migrations.RunPython.noop),
    ]