import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = [
  "#6C63FF",
  "#FF6584",
  "#36B37E",
  "#FFAB40",
  "#36A2EB",
  "#9966FF",
  "#FF7043",
  "#26A69A",
];

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

export function CategoryExpenseChart({ expenses, categories }) {
  const categoryData = categories
    .map((category) => {
      const total = expenses
        .filter((expense) => Number(expense.category) === Number(category.id))
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

      return {
        name: category.name,
        amount: Number(total.toFixed(2)),
      };
    })
    .filter((category) => category.amount > 0);

  return (
    <div className="chart-card">
      <div className="chart-heading">
        <div>
          <h3>Spending by Category</h3>
          <p>See where your money goes.</p>
        </div>
      </div>

      {categoryData.length === 0 ? (
        <div className="chart-empty">
          <span>📊</span>
          <p>No expense data available for the chart yet.</p>
          <small>Add an expense to see your spending breakdown.</small>
        </div>
      ) : (
        <>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius="72%"
                  innerRadius="42%"
                  paddingAngle={3}
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip formatter={(value) => formatCurrency(value)} />

                <Legend verticalAlign="bottom" height={45} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-total">
            <span>Total Spending</span>
            <strong>
              {formatCurrency(
                categoryData.reduce(
                  (sum, category) => sum + category.amount,
                  0,
                ),
              )}
            </strong>
          </div>
        </>
      )}
    </div>
  );
}

export function MonthlyExpenseChart({ expenses }) {
  const monthlyTotals = {};

  expenses.forEach((expense) => {
    if (!expense.date) return;

    const monthKey = expense.date.slice(0, 7);
    monthlyTotals[monthKey] =
      (monthlyTotals[monthKey] || 0) + Number(expense.amount || 0);
  });

  const monthlyData = Object.entries(monthlyTotals)
    .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
    .slice(-6)
    .map(([month, amount]) => {
      const [year, monthNumber] = month.split("-");

      const monthName = new Date(
        Number(year),
        Number(monthNumber) - 1,
        1,
      ).toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      });

      return {
        month: monthName,
        amount: Number(amount.toFixed(2)),
      };
    });

  return (
    <div className="chart-card">
      <div className="chart-heading">
        <div>
          <h3>Monthly Spending</h3>
          <p>Track your expenses over time.</p>
        </div>
      </div>

      {monthlyData.length === 0 ? (
        <div className="chart-empty">
          <span>📈</span>
          <p>No monthly spending data available yet.</p>
          <small>Add an expense to start tracking your spending.</small>
        </div>
      ) : (
        <div className="chart-container monthly-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 15, right: 10, left: 5, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E8E8F2"
              />

              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#737991" }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tickFormatter={(value) => `₹${value}`}
                tick={{ fontSize: 11, fill: "#737991" }}
                axisLine={false}
                tickLine={false}
                width={65}
              />

              <Tooltip formatter={(value) => formatCurrency(value)} />

              <Bar
                dataKey="amount"
                name="Expenses"
                fill="#6C63FF"
                radius={[7, 7, 0, 0]}
                maxBarSize={55}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
