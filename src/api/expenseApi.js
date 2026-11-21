const API_URL = "http://localhost:5000/api/v1";

// GET - Read
export const getExpenses = async (accessToken, filters = {}) => {
  const query = new URLSearchParams();

  if (filters.type) {
    query.append("type", filters.type);
  }

  if (filters.category) {
    query.append("category", filters.category);
  }

  if (filters.minAmount) {
    query.append("minAmount", filters.minAmount);
  }

  if (filters.maxAmount) {
    query.append("maxAmount", filters.maxAmount);
  }

  if (filters.startDate) {
    query.append("startDate", filters.startDate);
  }

  if (filters.endDate) {
    query.append("endDate", filters.endDate);
  }

  query.append("page", filters.page || 1);
  query.append("limit", filters.limit || 5);

  const response = await fetch(
    `${API_URL}/expenses?${query.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch transactions"
    );
  }

  return data;
};
// POST - Create
export const createExpense = async (accessToken, expenseData) => {
  const response = await fetch(`${API_URL}/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(expenseData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create transaction");
  }

  return data;
};

// PUT - Update
export const updateExpense = async (
  accessToken,
  id,
  expenseData
) => {
  const response = await fetch(`${API_URL}/expenses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(expenseData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update transaction");
  }

  return data;
};

// DELETE - Delete
export const deleteExpense = async (accessToken, id) => {
  const response = await fetch(`${API_URL}/expenses/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete transaction");
  }

  return data;
 
};

