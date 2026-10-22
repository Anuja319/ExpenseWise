import { useState } from "react";
import { loginUser, registerUser } from "./services/api";
import "./Auth.css";

function Auth({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }

    if (isRegister && !email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      if (isRegister) {
        await registerUser({
          username: username.trim(),
          email: email.trim(),
          password,
        });

        setSuccess("Registration successful! Please log in.");

        setIsRegister(false);
        setEmail("");
        setPassword("");
      } else {
        const data = await loginUser({
          username: username.trim(),
          password,
        });

        if (!data?.token) {
          throw new Error("Login succeeded without a token. Please try again.");
        }

        onLogin(data);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setIsRegister((previous) => !previous);
    setError("");
    setSuccess("");
    setPassword("");
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand-icon">₹</div>

        <h1>ExpenseWise</h1>

        <p className="auth-subtitle">
          {isRegister
            ? "Create an account to manage your finances."
            : "Welcome back! Sign in to manage your expenses."}
        </p>

        <h2>{isRegister ? "Create Account" : "Login"}</h2>

        {error && <div className="auth-message auth-error">{error}</div>}

        {success && <div className="auth-message auth-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="username">Username</label>

            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </div>

          {isRegister && (
            <div className="auth-field">
              <label htmlFor="email">Email Address</label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isRegister ? "new-password" : "current-password"}
              minLength={8}
              required
            />
          </div>

          <button
            className="auth-submit-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create Account"
                : "Login"}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "Don't have an account?"}

          <button type="button" onClick={switchMode}>
            {isRegister ? "Login" : "Register"}
          </button>
        </p>

        <p className="auth-footer">Track your spending. Manage your future.</p>
      </div>
    </div>
  );
}

export default Auth;
