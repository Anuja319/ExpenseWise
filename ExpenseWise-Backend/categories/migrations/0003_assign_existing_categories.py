from django.db import migrations


def assign_categories(apps, schema_editor):
    Category = apps.get_model("categories", "Category")
    User = apps.get_model("auth", "User")

    if not Category.objects.filter(user__isnull=True).exists():
        return

    user = User.objects.filter(username="Megha").first()

    if user is None:
        return

    Category.objects.filter(user__isnull=True).update(user_id=user.id)


class Migration(migrations.Migration):
    dependencies = [
        ("categories", "0002_category_user_alter_category_name_and_more"),
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.RunPython(assign_categories, migrations.RunPython.noop),
    ]
