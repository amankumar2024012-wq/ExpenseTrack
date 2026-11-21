import { useEffect, useMemo, useState } from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import { getExpenses } from "../api/expenseApi";

function Analytics() {
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // =========================
  // Load Transactions
  // =========================

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("accessToken");

        if (!token) {
          throw new Error(
            "Access token not found. Please login again."
          );
        }

        // Get a large page so analytics can use
        // all available transactions.
        const result = await getExpenses(token, {
          page: 1,
          limit: 100,
        });

        setTransactions(result.data || []);
      } catch (error) {
        console.error(
          "Analytics loading error:",
          error
        );

        setError(
          error.message ||
            "Failed to load analytics"
        );
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  // =========================
  // Calculate Summary
  // =========================

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach((transaction) => {
      if (transaction.type === "income") {
        income += Number(transaction.amount);
      }

      if (transaction.type === "expense") {
        expense += Number(transaction.amount);
      }
    });

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [transactions]);

  // =========================
  // Category Analytics
  // =========================

  const categoryData = useMemo(() => {
    const categoryTotals = {};

    transactions
      .filter(
        (transaction) =>
          transaction.type === "expense"
      )
      .forEach((transaction) => {
        const category = transaction.category;

        if (!categoryTotals[category]) {
          categoryTotals[category] = 0;
        }

        categoryTotals[category] += Number(
          transaction.amount
        );
      });

    return Object.entries(categoryTotals).map(
      ([category, amount]) => ({
        category:
          category.charAt(0).toUpperCase() +
          category.slice(1),
        amount,
      })
    );
  }, [transactions]);

  // =========================
  // Monthly Analytics
  // =========================

  const monthlyData = useMemo(() => {
    const months = {};

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);

      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!months[monthKey]) {
        months[monthKey] = {
          month: monthKey,
          income: 0,
          expense: 0,
        };
      }

      if (transaction.type === "income") {
        months[monthKey].income += Number(
          transaction.amount
        );
      }

      if (transaction.type === "expense") {
        months[monthKey].expense += Number(
          transaction.amount
        );
      }
    });

    return Object.values(months)
      .sort((a, b) =>
        a.month.localeCompare(b.month)
      )
      .map((item) => {
        const [year, month] =
          item.month.split("-");

        const date = new Date(
          Number(year),
          Number(month) - 1
        );

        return {
          ...item,
          month: date.toLocaleDateString(
            "en-IN",
            {
              month: "short",
              year: "numeric",
            }
          ),
        };
      });
  }, [transactions]);

  // =========================
  // Recent Transactions
  // =========================

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      )
      .slice(0, 5);
  }, [transactions]);

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="text-gray-500">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  // =========================
  // Error
  // =========================

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600">
        <h2 className="font-semibold">
          Failed to load analytics
        </h2>

        <p className="mt-1 text-sm">
          {error}
        </p>
      </div>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <div>
      {/* Header */}

      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Analytics
        </h1>

        <p className="mt-1 text-gray-500">
          Understand your income, expenses and
          spending patterns.
        </p>
      </div>

      {/* =========================
          Summary Cards
      ========================= */}

      <div className="mb-6 grid gap-5 md:grid-cols-3">
        {/* Income */}

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Income
          </p>

          <h2 className="mt-2 text-3xl font-bold text-green-600">
            ₹
            {summary.income.toLocaleString(
              "en-IN"
            )}
          </h2>
        </div>

        {/* Expense */}

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Expense
          </p>

          <h2 className="mt-2 text-3xl font-bold text-red-600">
            ₹
            {summary.expense.toLocaleString(
              "en-IN"
            )}
          </h2>
        </div>

        {/* Balance */}

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Net Balance
          </p>

          <h2
            className={`mt-2 text-3xl font-bold ${
              summary.balance >= 0
                ? "text-blue-600"
                : "text-red-600"
            }`}
          >
            ₹
            {summary.balance.toLocaleString(
              "en-IN"
            )}
          </h2>
        </div>
      </div>

      {/* =========================
          Monthly Income vs Expense
      ========================= */}

      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            Monthly Income vs Expense
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Compare your income and spending over
            time.
          </p>
        </div>

        {monthlyData.length === 0 ? (
          <div className="flex h-80 items-center justify-center text-gray-500">
            No transaction data available.
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="month" />

                <YAxis />

                <Tooltip
                  formatter={(value) =>
                    `₹${Number(
                      value
                    ).toLocaleString(
                      "en-IN"
                    )}`
                  }
                />

                <Legend />

                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#16a34a"
                  radius={[6, 6, 0, 0]}
                />

                <Bar
                  dataKey="expense"
                  name="Expense"
                  fill="#dc2626"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* =========================
          Category + Recent
      ========================= */}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Pie Chart */}

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Expense by Category
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              See where your money is being spent.
            </p>
          </div>

          {categoryData.length === 0 ? (
            <div className="flex h-80 items-center justify-center text-gray-500">
              No expense data available.
            </div>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {categoryData.map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            [
                              "#2563eb",
                              "#16a34a",
                              "#dc2626",
                              "#9333ea",
                              "#ea580c",
                            ][index %
                              5]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      `₹${Number(
                        value
                      ).toLocaleString(
                        "en-IN"
                      )}`
                    }
                  />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Transactions */}

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Recent Transactions
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your latest financial activity.
              </p>
            </div>

            <span className="text-sm text-gray-500">
              {transactions.length} total
            </span>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="flex h-80 items-center justify-center text-gray-500">
              No transactions available.
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map(
                (transaction) => (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">
                        {transaction.title}
                      </p>

                      <p className="mt-1 text-sm capitalize text-gray-500">
                        {transaction.category}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          transaction.type ===
                          "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type ===
                        "income"
                          ? "+"
                          : "-"}
                        ₹
                        {Number(
                          transaction.amount
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </p>

                      <p className="mt-1 text-xs capitalize text-gray-400">
                        {transaction.type}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Analytics;