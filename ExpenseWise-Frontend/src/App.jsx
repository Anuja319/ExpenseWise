import { useEffect, useState } from "react";
import Auth from "./Auth";
import { logoutUser } from "./services/api";

import {
  CategoryExpenseChart,
  MonthlyExpenseChart,
} from "./components/ExpenseCharts";

import {
  getExpenses,
  getCategories,
  deleteCategory,
  getBudgets,
  createExpense,
  updateExpense,
  deleteExpense,
  createBudget,
  updateBudget,
  deleteBudget,
  createCategory,
} from "./services/api";

import "./App.css";

const initialForm = {
  title: "",
  amount: "",
  category: "",
  date: new Date().toISOString().split("T")[0],
  description: "",
};

const initialBudgetForm = {
  name: "",
  category: "",
  monthly_limit: "",
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatCurrency(amount) {
  return `₹${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function App() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);

  const [token, setToken] = useState(() =>
    localStorage.getItem("expensewise_token"),
  );

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("expensewise_user") || "null");
    } catch {
      return null;
    }
  });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [activePage, setActivePage] = useState("Dashboard");

  // Automatically dismiss success and error messages after 3 seconds.
  useEffect(() => {
    if (!success && !error) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccess("");
      setError("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [success, error]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });

  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [budgetForm, setBudgetForm] = useState(initialBudgetForm);

  // Handle changes in the category form
  function handleCategoryChange(event) {
    const { name, value } = event.target;

    setCategoryForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  // Create a new category
  async function handleCategorySubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!categoryForm.name.trim()) {
      setError("Please enter a category name.");
      return;
    }

    try {
      setSaving(true);

      await createCategory({
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
      });

      setSuccess("Category created successfully!");

      setCategoryForm({
        name: "",
        description: "",
      });

      setShowCategoryForm(false);

      await loadData();
    } catch (err) {
      setError(err.message || "Unable to create category.");
    } finally {
      setSaving(false);
    }
  }

  // Load expenses, categories, and budgets from the backend.
  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [expenseData, categoryData, budgetData] = await Promise.all([
        getExpenses(),
        getCategories(),
        getBudgets(),
      ]);

      setExpenses(
        Array.isArray(expenseData) ? expenseData : expenseData?.results || [],
      );

      setCategories(
        Array.isArray(categoryData)
          ? categoryData
          : categoryData?.results || [],
      );

      setBudgets(
        Array.isArray(budgetData) ? budgetData : budgetData?.results || [],
      );
    } catch (err) {
      setError(err.message || "Unable to load ExpenseWise data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadData();
    } else {
      setLoading(false);
      setExpenses([]);
      setCategories([]);
      setBudgets([]);
    }
  }, [token]);

  // Dashboard calculations.
  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0,
  );

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const monthlyExpenses = expenses
    .filter((expense) => {
      const expenseDate = new Date(`${expense.date}T00:00:00`);

      return (
        expenseDate.getMonth() + 1 === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    })
    .reduce((total, expense) => total + Number(expense.amount), 0);

  // Get category name using its ID.
  function getCategoryName(categoryId) {
    const category = categories.find(
      (item) => Number(item.id) === Number(categoryId),
    );

    return category ? category.name : "Unknown Category";
  }

  // Filter and sort expenses
  const filteredExpenses = expenses
    .filter((expense) => {
      // Search by expense title or description
      const search = searchTerm.trim().toLowerCase();

      const matchesSearch =
        expense.title?.toLowerCase().includes(search) ||
        expense.description?.toLowerCase().includes(search);

      // Filter by category
      const matchesCategory =
        selectedCategory === "all" ||
        Number(expense.category) === Number(selectedCategory);

      // Filter by month and year
      const matchesMonth =
        selectedMonth === "all" || expense.date?.slice(0, 7) === selectedMonth;

      return matchesSearch && matchesCategory && matchesMonth;
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case "oldest":
          return (
            new Date(a.date + "T00:00:00") - new Date(b.date + "T00:00:00")
          );

        case "highest":
          return Number(b.amount) - Number(a.amount);

        case "lowest":
          return Number(a.amount) - Number(b.amount);

        case "newest":
        default:
          return (
            new Date(b.date + "T00:00:00") - new Date(a.date + "T00:00:00")
          );
      }
    });

  // Reset all filters
  function clearFilters() {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedMonth("all");
    setSortOrder("newest");
  }

  // ADD THE NEW FUNCTION HERE
  function exportExpensesToCSV() {
    if (expenses.length === 0) {
      setError("There are no expenses to export.");
      return;
    }

    const headers = ["Title", "Amount", "Category", "Date", "Description"];

    const escapeCSV = (value) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = expenses.map((expense) => {
      const formattedDate = expense.date
        ? expense.date.split("-").reverse().join("/")
        : "";

      return [
        expense.title,
        expense.amount,
        getCategoryName(expense.category),
        formattedDate,
        expense.description,
      ];
    });

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `ExpenseWise_Expenses_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    setSuccess("Expenses exported successfully!");
  }
  // Calculate spending for the exact budget category, month, and year.
  function getBudgetAnalysis(budget) {
    const budgetExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(`${expense.date}T00:00:00`);

      return (
        Number(expense.category) === Number(budget.category) &&
        expenseDate.getMonth() + 1 === Number(budget.month) &&
        expenseDate.getFullYear() === Number(budget.year)
      );
    });

    const spent = budgetExpenses.reduce(
      (total, expense) => total + Number(expense.amount),
      0,
    );

    const limit = Number(budget.monthly_limit);
    const remaining = limit - spent;
    const percentage = limit > 0 ? (spent / limit) * 100 : 0;

    return {
      spent,
      remaining,
      percentage,
      exceeded: spent > limit,
      reached: spent === limit,
    };
  }

  // Expense form functions.
  function openAddForm() {
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(expense) {
    setEditingId(expense.id);

    setForm({
      title: expense.title || "",
      amount: String(expense.amount ?? ""),
      category: String(expense.category ?? ""),
      date: expense.date || "",
      description: expense.description || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(initialForm);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("Please enter an expense title.");
      return;
    }

    if (
      form.amount === "" ||
      !Number.isFinite(Number(form.amount)) ||
      Number(form.amount) <= 0
    ) {
      setError("Please enter an amount greater than zero.");
      return;
    }

    if (!form.category) {
      setError("Please select a category.");
      return;
    }

    if (!form.date) {
      setError("Please select an expense date.");
      return;
    }

    const expenseData = {
      title: form.title.trim(),
      amount: Number(form.amount).toFixed(2),
      category: Number(form.category),
      date: form.date,
      description: form.description.trim(),
    };

    try {
      setSaving(true);

      if (editingId !== null) {
        await updateExpense(editingId, expenseData);
        setSuccess("Expense updated successfully!");
      } else {
        await createExpense(expenseData);
        setSuccess("Expense added successfully!");
      }

      closeForm();
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to save expense.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteExpense(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?",
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      setSaving(true);

      await deleteExpense(id);

      setSuccess("Expense deleted successfully!");

      await loadData();
    } catch (err) {
      setError(err.message || "Unable to delete expense.");
    } finally {
      setSaving(false);
    }
  }

  // Budget form functions.
  function openAddBudgetForm() {
    setEditingBudgetId(null);

    setBudgetForm({
      ...initialBudgetForm,
      month: String(new Date().getMonth() + 1),
      year: String(new Date().getFullYear()),
    });

    setError("");
    setSuccess("");
    setShowBudgetForm(true);
  }

  function openEditBudgetForm(budget) {
    setEditingBudgetId(budget.id);

    setBudgetForm({
      name: budget.name || "",
      category: String(budget.category ?? ""),
      monthly_limit: String(budget.monthly_limit ?? ""),
      month: String(budget.month),
      year: String(budget.year),
    });

    setError("");
    setSuccess("");
    setShowBudgetForm(true);
  }

  function closeBudgetForm() {
    setShowBudgetForm(false);
    setEditingBudgetId(null);
    setBudgetForm(initialBudgetForm);
  }

  function handleBudgetChange(event) {
    const { name, value } = event.target;

    setBudgetForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  async function handleBudgetSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!budgetForm.name.trim()) {
      setError("Please enter a budget name.");
      return;
    }

    if (!budgetForm.category) {
      setError("Please select a category.");
      return;
    }

    if (
      budgetForm.monthly_limit === "" ||
      !Number.isFinite(Number(budgetForm.monthly_limit)) ||
      Number(budgetForm.monthly_limit) <= 0
    ) {
      setError("Budget amount must be greater than zero.");
      return;
    }

    const month = Number(budgetForm.month);
    const year = Number(budgetForm.year);

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      setError("Please select a valid month.");
      return;
    }

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      setError("Please enter a valid year between 2000 and 2100.");
      return;
    }

    const budgetData = {
      name: budgetForm.name.trim(),
      category: Number(budgetForm.category),
      monthly_limit: Number(budgetForm.monthly_limit).toFixed(2),
      month,
      year,
    };

    const duplicateBudget = budgets.some(
      (budget) =>
        Number(budget.category) === budgetData.category &&
        Number(budget.month) === budgetData.month &&
        Number(budget.year) === budgetData.year &&
        budget.id !== editingBudgetId,
    );

    if (duplicateBudget) {
      setError(
        "A budget already exists for this category and month. Please edit the existing budget.",
      );
      return;
    }

    try {
      setSaving(true);

      if (editingBudgetId !== null) {
        await updateBudget(editingBudgetId, budgetData);
        setSuccess("Budget updated successfully!");
      } else {
        await createBudget(budgetData);
        setSuccess("Budget created successfully!");
      }

      closeBudgetForm();
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to save budget.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBudget(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this budget?",
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      setSaving(true);

      await deleteBudget(id);

      setSuccess("Budget deleted successfully!");

      await loadData();
    } catch (err) {
      setError(err.message || "Unable to delete budget.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCategory(category) {
    const confirmed = window.confirm(
      `Are you sure you want to delete the "${category.name}" category?`,
    );
    if (!confirmed) return;
    setError("");
    setSuccess("");
    try {
      setSaving(true);
      await deleteCategory(category.id);
      await loadData();
      setSuccess(`Category "${category.name}" deleted successfully!`);
    } catch (err) {
      setError(
        err.message ||
          "Unable to delete this category. It may be linked to expenses or budgets.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleLogin(data) {
    localStorage.setItem("expensewise_token", data.token);

    if (data.user) {
      localStorage.setItem("expensewise_user", JSON.stringify(data.user));
    }

    setToken(data.token);
    setCurrentUser(data.user || null);
    setActivePage("Dashboard");
  }

  async function handleLogout() {
    const savedToken = localStorage.getItem("expensewise_token");

    try {
      if (savedToken) {
        await logoutUser(savedToken);
      }
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      localStorage.removeItem("expensewise_token");
      localStorage.removeItem("expensewise_user");

      setToken(null);
      setCurrentUser(null);

      setExpenses([]);
      setCategories([]);
      setBudgets([]);

      setActivePage("Dashboard");
      setError("");
      setSuccess("");
    }
  }

  // Shared expense table.
  function ExpenseTable({ items }) {
    if (items.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">₹</div>
          <h3>No expenses found</h3>
          <p>Add an expense to start tracking your spending.</p>
        </div>
      );
    }

    return (
      <div className="table-wrapper">
        <table className="expense-table">
          <thead>
            <tr>
              <th>Expense</th>
              <th>Category</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {items.map((expense) => (
              <tr key={expense.id}>
                <td>
                  <div className="expense-title">
                    <div className="expense-avatar">₹</div>

                    <div className="expense-title-cell">
                      <strong>{expense.title}</strong>

                      {expense.description && (
                        <span>{expense.description}</span>
                      )}
                    </div>
                  </div>
                </td>

                <td>
                  <span className="category-pill">
                    {getCategoryName(expense.category)}
                  </span>
                </td>

                <td>{expense.date}</td>

                <td>
                  <strong>{formatCurrency(expense.amount)}</strong>
                </td>

                <td>
                  <div className="action-buttons">
                    <button
                      className="edit-button"
                      onClick={() => openEditForm(expense)}
                      aria-label={`Edit ${expense.title}`}
                      title="Edit expense"
                    >
                      ✎
                    </button>

                    <button
                      className="delete-button"
                      onClick={() => handleDeleteExpense(expense.id)}
                      aria-label={`Delete ${expense.title}`}
                      title="Delete expense"
                      disabled={saving}
                    >
                      ×
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">₹</div>

          <div>
            <h2>ExpenseWise</h2>
            <p>Personal Finance</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {[
            { name: "Dashboard", icon: "▦" },
            { name: "Expenses", icon: "↗" },
            { name: "Categories", icon: "◈" },
            { name: "Budgets", icon: "◷" },
          ].map((item) => (
            <button
              key={item.name}
              className={`nav-item ${activePage === item.name ? "active" : ""}`}
              onClick={() => {
                setActivePage(item.name);
                setError("");
                setSuccess("");
              }}
            >
              <span>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="sidebar-bottom">
          <div className="profile-avatar">
            {(currentUser?.username || "U").charAt(0).toUpperCase()}
          </div>

          <div className="profile-info">
            <strong>{currentUser?.username || "ExpenseWise User"}</strong>
            <span>{currentUser?.email || "Personal Account"}</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="logout-button"
            title="Logout"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">PERSONAL FINANCE MANAGER</p>
            <h1>{activePage}</h1>
          </div>

          {/* Existing Add Button */}
          <button
            className="primary-button"
            onClick={
              activePage === "Budgets"
                ? openAddBudgetForm
                : activePage === "Categories"
                  ? () => {
                      setError("");
                      setSuccess("");
                      setShowCategoryForm(true);
                    }
                  : openAddForm
            }
          >
            ＋{" "}
            {activePage === "Budgets"
              ? "Add Budget"
              : activePage === "Categories"
                ? "Add Category"
                : "Add Expense"}
          </button>
        </header>

        {error && (
          <div className="alert alert-error" role="alert">
            <span>⚠</span>
            <p>{error}</p>

            <button onClick={() => setError("")} aria-label="Dismiss error">
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="status">
            <span>✓</span>
            <p>{success}</p>

            <button
              onClick={() => setSuccess("")}
              aria-label="Dismiss success message"
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-state" role="status">
            <div className="spinner"></div>
            <p>Loading your financial data...</p>
          </div>
        ) : (
          <>
            {/* Dashboard */}
            {activePage === "Dashboard" && (
              <>
                <section className="summary-grid">
                  <article className="summary-card">
                    <div className="summary-icon purple">₹</div>

                    <div>
                      <p>Total Expenses</p>
                      <h2>{formatCurrency(totalExpenses)}</h2>
                      <small>All recorded expenses</small>
                    </div>
                  </article>

                  <article className="summary-card">
                    <div className="summary-icon green">↗</div>

                    <div>
                      <p>This Month</p>
                      <h2>{formatCurrency(monthlyExpenses)}</h2>
                      <small>Expenses this month</small>
                    </div>
                  </article>

                  <article className="summary-card">
                    <div className="summary-icon orange">▤</div>

                    <div>
                      <p>Total Transactions</p>
                      <h2>{expenses.length}</h2>
                      <small>Recorded transactions</small>
                    </div>
                  </article>

                  <article className="summary-card">
                    <div className="summary-icon blue">◷</div>

                    <div>
                      <p>Monthly Budgets</p>
                      <h2>{budgets.length}</h2>
                      <small>Budgets configured</small>
                    </div>
                  </article>
                </section>

                <div className="charts-grid">
                  <CategoryExpenseChart
                    expenses={expenses}
                    categories={categories}
                  />

                  <MonthlyExpenseChart expenses={expenses} />
                </div>

                <section className="content-card">
                  <div className="section-heading">
                    <div>
                      <h2>Recent Transactions</h2>
                      <p>A quick look at your latest spending activity.</p>
                    </div>

                    <button
                      className="text-button"
                      onClick={() => setActivePage("Expenses")}
                    >
                      View all →
                    </button>
                  </div>

                  <ExpenseTable items={expenses.slice(0, 5)} />
                </section>

                <section className="content-card">
                  <div className="section-heading">
                    <div>
                      <h2>Budget Overview</h2>
                      <p>Check your spending against your limits.</p>
                    </div>

                    <button
                      className="text-button"
                      onClick={() => setActivePage("Budgets")}
                    >
                      View budgets →
                    </button>
                  </div>

                  {budgets.length === 0 ? (
                    <div className="empty-state">
                      <h3>No budgets created</h3>
                      <p>Create a monthly budget to monitor spending.</p>

                      <button
                        className="primary-button"
                        onClick={openAddBudgetForm}
                      >
                        Create Budget
                      </button>
                    </div>
                  ) : (
                    <div className="budget-grid">
                      {budgets.map((budget) => {
                        const analysis = getBudgetAnalysis(budget);

                        return (
                          <article className="budget-card" key={budget.id}>
                            <span className="budget-badge">
                              {monthNames[Number(budget.month) - 1]}{" "}
                              {budget.year}
                            </span>

                            <h3>{budget.name}</h3>

                            <p className="budget-category">
                              {getCategoryName(budget.category)}
                            </p>

                            <p className="budget-period">
                              Spent {formatCurrency(analysis.spent)} of{" "}
                              {formatCurrency(budget.monthly_limit)}
                            </p>

                            <div className="budget-progress-track">
                              <div
                                className={
                                  analysis.exceeded
                                    ? "budget-progress-fill over-budget"
                                    : analysis.percentage >= 80
                                      ? "budget-progress-fill warning"
                                      : "budget-progress-fill"
                                }
                                style={{
                                  width: `${Math.min(
                                    analysis.percentage,
                                    100,
                                  )}%`,
                                }}
                              ></div>
                            </div>

                            <strong>
                              {Math.round(analysis.percentage)}% used
                            </strong>

                            {/* Smart Budget Alerts */}

                            {analysis.exceeded ? (
                              <div className="budget-alert alert-danger">
                                🚨 Budget Exceeded!
                                <p>
                                  You have exceeded your budget by{" "}
                                  <strong>
                                    {formatCurrency(
                                      Math.abs(analysis.remaining),
                                    )}
                                  </strong>
                                </p>
                              </div>
                            ) : analysis.percentage >= 80 ? (
                              <div className="budget-alert alert-warning">
                                ⚠️ Budget Warning!
                                <p>
                                  You have used{" "}
                                  {Math.round(analysis.percentage)}% of your
                                  budget.
                                </p>
                                <p>
                                  Remaining:{" "}
                                  {formatCurrency(analysis.remaining)}
                                </p>
                              </div>
                            ) : (
                              <div className="budget-alert alert-success">
                                ✅ Within Budget
                                <p>
                                  Remaining:{" "}
                                  {formatCurrency(analysis.remaining)}
                                </p>
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )}

            {/* Expenses Page */}
            {activePage === "Expenses" && (
              <section className="content-card">
                <div className="section-heading">
                  <div>
                    <h2>All Expenses</h2>
                    <p>Search, filter, and manage your transactions.</p>
                  </div>

                  <div className="expense-action-buttons">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={exportExpensesToCSV}
                    >
                      ↓ Export CSV
                    </button>

                    <button
                      type="button"
                      className="primary-button"
                      onClick={openAddForm}
                    >
                      ＋ Add Expense
                    </button>
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="expense-filters">
                  {/* Search */}
                  <div className="filter-field search-field">
                    <label htmlFor="expense-search">Search Expenses</label>

                    <input
                      id="expense-search"
                      type="search"
                      placeholder="Search title or description..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="filter-field">
                    <label htmlFor="category-filter">Category</label>

                    <select
                      id="category-filter"
                      value={selectedCategory}
                      onChange={(event) =>
                        setSelectedCategory(event.target.value)
                      }
                    >
                      <option value="all">All Categories</option>

                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Month Filter */}
                  <div className="filter-field">
                    <label htmlFor="month-filter">Month</label>

                    <input
                      id="month-filter"
                      type="month"
                      value={selectedMonth === "all" ? "" : selectedMonth}
                      onChange={(event) =>
                        setSelectedMonth(event.target.value || "all")
                      }
                    />
                  </div>

                  {/* Sort */}
                  <div className="filter-field">
                    <label htmlFor="expense-sort">Sort By</label>

                    <select
                      id="expense-sort"
                      value={sortOrder}
                      onChange={(event) => setSortOrder(event.target.value)}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="highest">Highest Amount</option>
                      <option value="lowest">Lowest Amount</option>
                    </select>
                  </div>

                  {/* Clear Filters */}
                  <button
                    type="button"
                    className="secondary-button clear-filters-button"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                </div>

                {/* Result Count */}
                <div className="filter-results">
                  Showing <strong>{filteredExpenses.length}</strong> of{" "}
                  <strong>{expenses.length}</strong> expenses
                </div>

                {/* Filtered Expense Table */}
                <ExpenseTable items={filteredExpenses} />
              </section>
            )}

            {/* Categories */}
            {activePage === "Categories" && (
              <section className="content-card">
                <div className="section-heading">
                  <div>
                    <h2>Expense Categories</h2>
                    <p>Manage the categories used to organize expenses.</p>
                  </div>

                  <button
                    className="primary-button"
                    onClick={() => {
                      setError("");
                      setSuccess("");
                      setShowCategoryForm(true);
                    }}
                  >
                    ＋ Add Category
                  </button>
                </div>

                {categories.length === 0 ? (
                  <div className="empty-state">
                    <h3>No categories available</h3>
                    <p>Create categories through your backend API.</p>
                  </div>
                ) : (
                  <div className="category-grid">
                    {categories.map((category) => {
                      const categoryTotal = expenses
                        .filter(
                          (expense) =>
                            Number(expense.category) === Number(category.id),
                        )
                        .reduce(
                          (total, expense) => total + Number(expense.amount),
                          0,
                        );

                      return (
                        <article className="category-card" key={category.id}>
                          <div className="category-icon">◈</div>

                          <div>
                            <h3>{category.name}</h3>

                            <p>
                              {category.description ||
                                "No description provided."}
                            </p>

                            <div className="category-total">
                              <span>
                                {
                                  expenses.filter(
                                    (expense) =>
                                      Number(expense.category) ===
                                      Number(category.id),
                                  ).length
                                }{" "}
                                transactions
                              </span>

                              <strong>{formatCurrency(categoryTotal)}</strong>
                            </div>
                            <button
                              type="button"
                              className="delete-button"
                              onClick={() => handleDeleteCategory(category)}
                              disabled={saving}
                            >
                              {" "}
                              {saving ? "Deleting..." : "Delete"}{" "}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Budgets with spending analysis */}
            {activePage === "Budgets" && (
              <section className="content-card">
                <div className="section-heading">
                  <div>
                    <h2>Monthly Budgets</h2>
                    <p>Track your spending and manage your monthly limits.</p>
                  </div>

                  <button
                    className="primary-button"
                    onClick={openAddBudgetForm}
                  >
                    ＋ Add Budget
                  </button>
                </div>

                {budgets.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">◷</div>
                    <h3>No budgets yet</h3>
                    <p>Create your first budget to start tracking spending.</p>

                    <button
                      className="primary-button"
                      onClick={openAddBudgetForm}
                    >
                      Create Your First Budget
                    </button>
                  </div>
                ) : (
                  <div className="budget-grid">
                    {budgets.map((budget) => {
                      const analysis = getBudgetAnalysis(budget);

                      const progressWidth = Math.min(analysis.percentage, 100);

                      const progressClass = analysis.exceeded
                        ? "budget-progress-fill over-budget"
                        : analysis.percentage >= 80
                          ? "budget-progress-fill warning"
                          : "budget-progress-fill";

                      return (
                        <article className="budget-card" key={budget.id}>
                          <div className="budget-card-header">
                            <span className="budget-badge">MONTHLY BUDGET</span>

                            <div className="action-buttons">
                              <button
                                className="edit-button"
                                onClick={() => openEditBudgetForm(budget)}
                                aria-label={`Edit ${budget.name}`}
                                title="Edit budget"
                              >
                                ✎
                              </button>

                              <button
                                className="delete-button"
                                onClick={() => handleDeleteBudget(budget.id)}
                                aria-label={`Delete ${budget.name}`}
                                title="Delete budget"
                                disabled={saving}
                              >
                                ×
                              </button>
                            </div>
                          </div>

                          <h3>{budget.name}</h3>

                          <p className="budget-category">
                            {getCategoryName(budget.category)}
                          </p>

                          <p className="budget-period">
                            {new Date(
                              Number(budget.year),
                              Number(budget.month) - 1,
                              1,
                            ).toLocaleDateString("en-IN", {
                              month: "long",
                              year: "numeric",
                            })}
                          </p>

                          <div className="budget-amount-row">
                            <div>
                              <span className="budget-detail-label">
                                Monthly limit
                              </span>

                              <h2>{formatCurrency(budget.monthly_limit)}</h2>
                            </div>

                            <div className="budget-percent">
                              {Math.round(analysis.percentage)}%
                              <span> used</span>
                            </div>
                          </div>

                          <div
                            className="budget-progress-track"
                            role="progressbar"
                            aria-label={`${budget.name} budget usage`}
                            aria-valuenow={Math.min(
                              Math.round(analysis.percentage),
                              100,
                            )}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className={progressClass}
                              style={{
                                width: `${progressWidth}%`,
                              }}
                            ></div>
                          </div>

                          <div className="budget-stats">
                            <div>
                              <span>Spent</span>

                              <strong>{formatCurrency(analysis.spent)}</strong>
                            </div>

                            <div>
                              <span>
                                {analysis.remaining < 0
                                  ? "Over budget"
                                  : "Remaining"}
                              </span>

                              <strong
                                className={
                                  analysis.exceeded
                                    ? "budget-danger"
                                    : "budget-positive"
                                }
                              >
                                {formatCurrency(Math.abs(analysis.remaining))}
                              </strong>
                            </div>
                          </div>

                          {analysis.exceeded ? (
                            <div className="budget-warning" role="status">
                              ⚠ You have exceeded this budget by{" "}
                              {formatCurrency(Math.abs(analysis.remaining))}.
                            </div>
                          ) : analysis.reached ? (
                            <div className="budget-warning" role="status">
                              ⚠ You have reached your monthly budget limit.
                            </div>
                          ) : analysis.percentage >= 80 ? (
                            <div className="budget-warning" role="status">
                              ⚠ You have used at least 80% of your budget.
                            </div>
                          ) : (
                            <div className="budget-success" role="status">
                              ✓ You are within your budget.
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {/* Add/Edit Expense Modal */}
      {showForm && (
        <div className="modal-overlay">
          <section
            className="expense-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-form-title"
          >
            <div className="modal-header">
              <div>
                <h2 id="expense-form-title">
                  {editingId !== null ? "Edit Expense" : "Add New Expense"}
                </h2>

                <p>Enter the details of your transaction.</p>
              </div>

              <button
                className="close-button"
                onClick={closeForm}
                aria-label="Close expense form"
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="expense-title">Expense Title *</label>

              <input
                id="expense-title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Grocery shopping"
                maxLength={200}
                required
              />

              <div className="form-row">
                <div>
                  <label htmlFor="expense-amount">Amount (₹) *</label>

                  <input
                    id="expense-amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="e.g. 500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="expense-date">Date *</label>

                  <input
                    id="expense-date"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <label htmlFor="expense-category">Category *</label>

              <select
                id="expense-category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="">Select category</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <label htmlFor="expense-description">Description</label>

              <textarea
                id="expense-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Optional notes about this expense"
                rows="3"
              ></textarea>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Update Expense"
                      : "Save Expense"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Add/Edit Budget Modal */}
      {showBudgetForm && (
        <div className="modal-overlay">
          <section
            className="expense-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="budget-form-title"
          >
            <div className="modal-header">
              <div>
                <h2 id="budget-form-title">
                  {editingBudgetId !== null
                    ? "Edit Budget"
                    : "Create Monthly Budget"}
                </h2>

                <p>Set a spending limit for a category.</p>
              </div>

              <button
                className="close-button"
                onClick={closeBudgetForm}
                aria-label="Close budget form"
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleBudgetSubmit}>
              <label htmlFor="budget-name">Budget Name *</label>

              <input
                id="budget-name"
                name="name"
                value={budgetForm.name}
                onChange={handleBudgetChange}
                placeholder="e.g. Food Budget"
                maxLength={100}
                required
              />

              <label htmlFor="budget-category">Category *</label>

              <select
                id="budget-category"
                name="category"
                value={budgetForm.category}
                onChange={handleBudgetChange}
                required
              >
                <option value="">Select category</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <label htmlFor="monthly-limit">Monthly Budget Amount (₹) *</label>

              <input
                id="monthly-limit"
                name="monthly_limit"
                type="number"
                min="0.01"
                step="0.01"
                value={budgetForm.monthly_limit}
                onChange={handleBudgetChange}
                placeholder="e.g. 3000"
                required
              />

              <div className="form-row">
                <div>
                  <label htmlFor="budget-month">Month *</label>

                  <select
                    id="budget-month"
                    name="month"
                    value={budgetForm.month}
                    onChange={handleBudgetChange}
                    required
                  >
                    {monthNames.map((monthName, index) => (
                      <option key={monthName} value={index + 1}>
                        {monthName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="budget-year">Year *</label>

                  <input
                    id="budget-year"
                    name="year"
                    type="number"
                    min="2000"
                    max="2100"
                    value={budgetForm.year}
                    onChange={handleBudgetChange}
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeBudgetForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingBudgetId !== null
                      ? "Update Budget"
                      : "Create Budget"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryForm && (
        <div className="modal-overlay">
          <section
            className="expense-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-form-title"
          >
            <div className="modal-header">
              <div>
                <h2 id="category-form-title">Add Category</h2>
                <p>Create a category for your expenses.</p>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={() => setShowCategoryForm(false)}
                aria-label="Close category form"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCategorySubmit}>
              <label htmlFor="category-name">Category Name *</label>

              <input
                id="category-name"
                name="name"
                value={categoryForm.name}
                onChange={handleCategoryChange}
                placeholder="e.g. Travel"
                maxLength={100}
                required
              />

              <label htmlFor="category-description">Description</label>

              <textarea
                id="category-description"
                name="description"
                value={categoryForm.description}
                onChange={handleCategoryChange}
                placeholder="Describe this category"
                rows="3"
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowCategoryForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Create Category"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
