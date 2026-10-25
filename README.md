# ExpenseWise — Personal Expense & Budget Tracker

ExpenseWise is a full-stack web application that helps users manage their personal expenses, organize categories, and track monthly budgets. It includes user authentication, interactive charts, search, filtering, and CSV export.

## 🌐 Live Demo

- **Frontend Application:** [Open ExpenseWise](YOUR_VERCEL_URL)
- **Backend API:** https://expensewise-el7c.onrender.com
- **Expenses API:** https://expensewise-el7c.onrender.com/api/expenses/

> Replace `YOUR_VERCEL_URL` with your actual Vercel deployment URL.

## ✨ Features

- User registration, login, and logout
- Create, view, edit, and delete expenses
- Manage expense categories
- Create and manage budgets
- Search and filter expenses
- Interactive charts and spending summaries
- CSV export
- User-specific data isolation

## 🛠️ Technologies Used

### Frontend

- React.js
- Vite
- JavaScript
- CSS

### Backend

- Python
- Django
- Django REST Framework
- Token Authentication

### Database and Deployment

- PostgreSQL
- Render — Backend hosting
- Vercel — Frontend hosting

## 📁 Project Structure

ExpenseWise/
├── ExpenseWise-Backend/
│ ├── manage.py
│ └── ...
├── ExpenseWise-Frontend/
│ └── expensewise-frontend/
│ ├── src/
│ ├── public/
│ └── package.json
└── README.md

## 🚀 Run Locally

### Backend

1. Open a terminal in the backend directory.
2. Activate your Python virtual environment.
3. Install the dependencies:

pip install -r requirements.txt

4. Apply database migrations:

python manage.py migrate

5. Start the Django development server:

python manage.py runserver

Backend URL: http://127.0.0.1:8000/

### Frontend

1. Open another terminal in the frontend directory.
2. Install the dependencies:

npm install

3. Configure the frontend API URL in your `.env` file:

VITE_API_BASE_URL=http://127.0.0.1:8000/api

4. Start the Vite development server:

npm run dev

Follow the local URL displayed in your terminal.

## 🔐 Security

- Authentication is required for protected API endpoints.
- User-specific data is isolated between accounts.
- Secret keys and database credentials should be stored in environment variables, never committed to GitHub.

## 👩‍💻 Developer

Developed as a full-stack web development project to demonstrate frontend development, REST API integration, authentication, database management, and deployment.
