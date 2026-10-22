from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def home(request):
    return JsonResponse({
        "message": "Welcome to ExpenseWise API!",
        "endpoints": {
            "register": "/api/accounts/register/",
            "login": "/api/accounts/login/",
            "logout": "/api/accounts/logout/",
            "categories": "/api/categories/",
            "expenses": "/api/expenses/",
            "budgets": "/api/budgets/"
        }
    })


urlpatterns = [
    path("", home, name="home"),
    path("admin/", admin.site.urls),
    path("api/accounts/", include("accounts.urls")),
    path("api/categories/", include("categories.urls")),
    path("api/expenses/", include("expenses.urls")),
    path("api/budgets/", include("budgets.urls")),
]