import { useEffect, useState } from "react";
import { getExpenses } from "../api/expenseApi";

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        if (!token) {
          throw new Error("Access token not found");
        }

        const result = await getExpenses(token);

        setExpenses(result.data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  const totalExpense = expenses
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + item.amount, 0);

  const totalIncome = expenses
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + item.amount, 0);

  const balance = totalIncome - totalExpense;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">
          Loading transactions...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Welcome back, Aman 👋
        </h1>

        <p className="mt-1 text-gray-500">
          Here's what's happening with your money.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-5 md:grid-cols-3">

        {/* Balance */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Balance
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            ₹{balance.toLocaleString("en-IN")}
          </h2>
        </div>

        {/* Income */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Income
          </p>

          <h2 className="mt-2 text-3xl font-bold text-green-600">
            ₹{totalIncome.toLocaleString("en-IN")}
          </h2>
        </div>

        {/* Expense */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Expense
          </p>

          <h2 className="mt-2 text-3xl font-bold text-red-600">
            ₹{totalExpense.toLocaleString("en-IN")}
          </h2>
        </div>
      </div>

      {/* Transactions */}
      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">

        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Recent Transactions
          </h2>

          <span className="text-sm text-gray-500">
            {expenses.length} transactions
          </span>
        </div>

        {expenses.length === 0 ? (
          <p className="text-gray-500">
            No transactions found.
          </p>
        ) : (
          <div className="space-y-3">
            {expenses.slice(0, 5).map((expense) => (
              <div
                key={expense._id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <h3 className="font-medium">
                    {expense.title}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {expense.category}
                  </p>
                </div>

                <p
                  className={`font-semibold ${
                    expense.type === "income"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {expense.type === "income"
                    ? "+"
                    : "-"}
                  ₹{expense.amount.toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;