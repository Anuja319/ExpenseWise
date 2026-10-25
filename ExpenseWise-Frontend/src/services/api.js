// ==========================================
// API BASE URL
// ==========================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

// ==========================================
// COMMON API REQUEST FUNCTION
// ==========================================

async function request(endpoint, options = {}) {
  try {
    const token = localStorage.getItem("expensewise_token");

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Token ${token}` } : {}),
        ...options.headers,
      },
    });

    // Handle responses that contain no JSON body
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const firstError = data ? Object.values(data).flat()[0] : null;

      throw new Error(
        typeof firstError === "string"
          ? firstError
          : `Request failed with status ${response.status}`,
      );
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Cannot connect to the backend. Check that Django is running.",
      );
    }

    throw error;
  }
}

// ==========================================
// AUTHENTICATION API FUNCTIONS
// ==========================================

// Register a new user
export async function registerUser(userData) {
  return request("/accounts/register/", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

// Log in an existing user
export async function loginUser(credentials) {
  return request("/accounts/login/", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

// Log out the current user
export async function logoutUser(token) {
  const response = await fetch(`${API_BASE_URL}/accounts/logout/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.detail || "Logout failed.");
  }

  return data;
}

// ==========================================
// CATEGORY API FUNCTIONS
// ==========================================

// Get all categories
export const getCategories = () => request("/categories/");

// Delete a category
export const deleteCategory = (id) =>
  request(`/categories/${id}/`, { method: "DELETE" });

// Create a new category
export const createCategory = (category) =>
  request("/categories/", {
    method: "POST",
    body: JSON.stringify(category),
  });

// ==========================================
// EXPENSE API FUNCTIONS
// ==========================================

// Get all expenses
export const getExpenses = () => request("/expenses/");

// Create a new expense
export const createExpense = (expense) =>
  request("/expenses/", {
    method: "POST",
    body: JSON.stringify(expense),
  });

// Update an existing expense
export const updateExpense = (id, expense) =>
  request(`/expenses/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(expense),
  });

// Delete an expense
export const deleteExpense = (id) =>
  request(`/expenses/${id}/`, {
    method: "DELETE",
  });

// ==========================================
// BUDGET API FUNCTIONS
// ==========================================

// Get all budgets
export const getBudgets = () => request("/budgets/");

// Create a new budget
export const createBudget = (budget) =>
  request("/budgets/", {
    method: "POST",
    body: JSON.stringify(budget),
  });

// Update an existing budget
export const updateBudget = (id, budget) =>
  request(`/budgets/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(budget),
  });

// Delete a budget
export const deleteBudget = (id) =>
  request(`/budgets/${id}/`, {
    method: "DELETE",
  });
