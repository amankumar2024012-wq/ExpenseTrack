import { useEffect, useState } from "react";

import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../api/expenseApi";

const defaultFilters = {
  type: "",
  category: "",
  minAmount: "",
  maxAmount: "",
  startDate: "",
  endDate: "",
  page: 1,
  limit: 5,
};

const defaultFormData = {
  title: "",
  amount: "",
  type: "expense",
  category: "food",
  description: "",
};

function Transactions() {
  // =========================
  // Transactions State
  // =========================

  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // =========================
  // Form State
  // =========================

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState(defaultFormData);

  // =========================
  // Filter State
  // =========================

  const [filters, setFilters] = useState(defaultFilters);

  // =========================
  // Pagination State
  // =========================

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 0,
  });

  // =========================
  // Load Transactions
  // =========================

  const loadTransactions = async (currentFilters = defaultFilters) => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("accessToken");

      if (!token) {
        throw new Error("Access token not found. Please login again.");
      }

      const result = await getExpenses(token, currentFilters);

      setTransactions(result.data || []);

      setPagination(
        result.pagination || {
          total: 0,
          page: currentFilters.page || 1,
          limit: currentFilters.limit || 5,
          totalPages: 0,
        }
      );
    } catch (error) {
      console.error("Load transactions error:", error);

      setError(
        error.message || "Failed to load transactions"
      );

      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Initial Load
  // =========================

  useEffect(() => {
    loadTransactions(defaultFilters);
  }, []);

  // =========================
  // Form Input Change
  // =========================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================
  // Filter Change
  // =========================

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
      page: 1,
    }));
  };

  // =========================
  // Apply Filters
  // =========================

  const applyFilters = () => {
    const newFilters = {
      ...filters,
      page: 1,
    };

    setFilters(newFilters);

    loadTransactions(newFilters);
  };

  // =========================
  // Reset Filters
  // =========================

  const resetFilters = () => {
    const newFilters = {
      ...defaultFilters,
    };

    setFilters(newFilters);

    loadTransactions(newFilters);
  };

  // =========================
  // Change Page
  // =========================

  const changePage = (newPage) => {
    if (newPage < 1) {
      return;
    }

    if (
      pagination.totalPages > 0 &&
      newPage > pagination.totalPages
    ) {
      return;
    }

    const newFilters = {
      ...filters,
      page: newPage,
    };

    setFilters(newFilters);

    loadTransactions(newFilters);
  };

  // =========================
  // Submit Form
  // =========================

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setError("");

      const token = localStorage.getItem("accessToken");

      if (!token) {
        throw new Error(
          "Access token not found. Please login again."
        );
      }

      // Convert amount from string to number
      const data = {
        title: formData.title.trim(),
        amount: Number(formData.amount),
        type: formData.type,
        category: formData.category,
        description: formData.description.trim(),
      };

      // Basic frontend validation
      if (!data.title) {
        throw new Error("Title is required.");
      }

      if (!data.amount || data.amount <= 0) {
        throw new Error(
          "Amount must be greater than 0."
        );
      }

      // Update existing transaction
      if (editingId) {
        await updateExpense(
          token,
          editingId,
          data
        );
      }

      // Create new transaction
      else {
        await createExpense(
          token,
          data
        );
      }

      // Reset form
      setFormData({
        ...defaultFormData,
      });

      setEditingId(null);

      setShowForm(false);

      // Reload transactions
      await loadTransactions(filters);
    } catch (error) {
      console.error("Submit transaction error:", error);

      setError(
        error.message ||
          "Failed to save transaction"
      );
    }
  };

  // =========================
  // Edit Transaction
  // =========================

  const handleEdit = (transaction) => {
    setFormData({
      title: transaction.title || "",
      amount: transaction.amount || "",
      type: transaction.type || "expense",
      category: transaction.category || "food",
      description: transaction.description || "",
    });

    setEditingId(transaction._id);

    setShowForm(true);

    setError("");

    // Scroll to top
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================
  // Delete Transaction
  // =========================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setError("");

      const token = localStorage.getItem("accessToken");

      if (!token) {
        throw new Error(
          "Access token not found. Please login again."
        );
      }

      await deleteExpense(token, id);

      // If deleting the last item on a page,
      // go back one page if necessary.
      let pageToLoad = filters.page;

      if (
        transactions.length === 1 &&
        filters.page > 1
      ) {
        pageToLoad = filters.page - 1;
      }

      const newFilters = {
        ...filters,
        page: pageToLoad,
      };

      setFilters(newFilters);

      await loadTransactions(newFilters);
    } catch (error) {
      console.error("Delete transaction error:", error);

      setError(
        error.message ||
          "Failed to delete transaction"
      );
    }
  };

  // =========================
  // Cancel Form
  // =========================

  const handleCancel = () => {
    setShowForm(false);

    setEditingId(null);

    setFormData({
      ...defaultFormData,
    });

    setError("");
  };

  // =========================
  // Loading UI
  // =========================

  if (loading && transactions.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>

          <p className="text-gray-500">
            Loading transactions...
          </p>
        </div>
      </div>
    );
  }

  // =========================
  // Main UI
  // =========================

  return (
    <div>
      {/* =========================
          Header
      ========================= */}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Transactions
          </h1>

          <p className="mt-1 text-gray-500">
            Manage your income and expenses.
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({
              ...defaultFormData,
            });
            setError("");
          }}
          className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
        >
          + Add Transaction
        </button>
      </div>

      {/* =========================
          Error
      ========================= */}

      {error && (
        <div className="mb-5 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          <p>{error}</p>

          <button
            onClick={() => setError("")}
            className="ml-4 font-bold text-red-500"
          >
            ✕
          </button>
        </div>
      )}

      {/* =========================
          Filters
      ========================= */}

      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Filters
          </h2>

          <span className="text-sm text-gray-500">
            {pagination.total} total transactions
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Type */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Type
            </label>

            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-blue-500"
            >
              <option value="">
                All Types
              </option>

              <option value="income">
                Income
              </option>

              <option value="expense">
                Expense
              </option>
            </select>
          </div>

          {/* Category */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Category
            </label>

            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-blue-500"
            >
              <option value="">
                All Categories
              </option>

              <option value="food">
                Food
              </option>

              <option value="travel">
                Travel
              </option>

              <option value="bills">
                Bills
              </option>

              <option value="shopping">
                Shopping
              </option>

              <option value="other">
                Other
              </option>
            </select>
          </div>

          {/* Min Amount */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Minimum Amount
            </label>

            <input
              type="number"
              name="minAmount"
              value={filters.minAmount}
              onChange={handleFilterChange}
              placeholder="e.g. 100"
              min="0"
              className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          {/* Max Amount */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Maximum Amount
            </label>

            <input
              type="number"
              name="maxAmount"
              value={filters.maxAmount}
              onChange={handleFilterChange}
              placeholder="e.g. 5000"
              min="0"
              className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          {/* Start Date */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Start Date
            </label>

            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          {/* End Date */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              End Date
            </label>

            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Filter Buttons */}

        <div className="mt-5 flex gap-3">
          <button
            onClick={applyFilters}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Loading..."
              : "Apply Filters"}
          </button>

          <button
            onClick={resetFilters}
            disabled={loading}
            className="rounded-lg border px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </div>

      {/* =========================
          Add/Edit Form
      ========================= */}

      {showForm && (
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {editingId
                  ? "Edit Transaction"
                  : "Add Transaction"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Enter transaction details below.
              </p>
            </div>

            <button
              onClick={handleCancel}
              className="text-xl text-gray-400 hover:text-gray-800"
            >
              ✕
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-4 md:grid-cols-2"
          >
            {/* Title */}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Title
              </label>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Pizza"
                required
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            {/* Amount */}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Amount
              </label>

              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="500"
                min="1"
                step="0.01"
                required
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            {/* Type */}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Type
              </label>

              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="expense">
                  Expense
                </option>

                <option value="income">
                  Income
                </option>
              </select>
            </div>

            {/* Category */}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Category
              </label>

              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="food">
                  Food
                </option>

                <option value="travel">
                  Travel
                </option>

                <option value="bills">
                  Bills
                </option>

                <option value="shopping">
                  Shopping
                </option>

                <option value="other">
                  Other
                </option>
              </select>
            </div>

            {/* Description */}

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Optional description"
                rows="3"
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            {/* Buttons */}

            <div className="flex gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editingId
                  ? "Update Transaction"
                  : "Add Transaction"}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================
          Transactions Table
      ========================= */}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-semibold">
            All Transactions
          </h2>

          {loading && (
            <span className="text-sm text-gray-500">
              Updating...
            </span>
          )}
        </div>

        {/* Empty State */}

        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mb-3 text-4xl">
              💳
            </div>

            <h3 className="font-semibold text-gray-800">
              No transactions found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your filters or add a new transaction.
            </p>

            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({
                  ...defaultFormData,
                });
              }}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
            >
              + Add Transaction
            </button>
          </div>
        ) : (
          <>
            {/* Table */}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Title
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Category
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Type
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                      Amount
                    </th>

                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {transactions.map(
                    (transaction) => (
                      <tr
                        key={transaction._id}
                        className="border-t transition hover:bg-gray-50"
                      >
                        {/* Title */}

                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-800">
                            {transaction.title}
                          </p>

                          {transaction.description && (
                            <p className="mt-1 text-sm text-gray-500">
                              {transaction.description}
                            </p>
                          )}
                        </td>

                        {/* Category */}

                        <td className="px-6 py-4 capitalize text-gray-600">
                          {transaction.category}
                        </td>

                        {/* Type */}

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              transaction.type ===
                              "income"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {transaction.type}
                          </span>
                        </td>

                        {/* Amount */}

                        <td
                          className={`px-6 py-4 font-semibold ${
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
                        </td>

                        {/* Actions */}

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                handleEdit(
                                  transaction
                                )
                              }
                              className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                handleDelete(
                                  transaction._id
                                )
                              }
                              className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* =========================
                Pagination
            ========================= */}

            {pagination.totalPages > 0 && (
              <div className="flex flex-col gap-3 border-t bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Page{" "}
                  <span className="font-medium text-gray-700">
                    {pagination.page}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-gray-700">
                    {pagination.totalPages}
                  </span>
                </p>

                <div className="flex gap-2">
                  <button
                    disabled={
                      pagination.page === 1 ||
                      loading
                    }
                    onClick={() =>
                      changePage(
                        pagination.page - 1
                      )
                    }
                    className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Previous
                  </button>

                  <button
                    disabled={
                      pagination.page ===
                        pagination.totalPages ||
                      loading
                    }
                    onClick={() =>
                      changePage(
                        pagination.page + 1
                      )
                    }
                    className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Transactions;