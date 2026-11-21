import Expense from "../models/expense.js";

// Create Transaction
export const createExpense = async (req, res, next) => {
  try {
    const {
      title,
      amount,
      type,
      category,
      date,
      description,
    } = req.body;

    const expense = await Expense.create({
      user: req.user.userId,
      title,
      amount,
      type,
      category,
      date,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};


// Get Transactions with Filters + Pagination
export const getExpenses = async (req, res, next) => {
  try {
    const {
      type,
      category,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    // Only logged-in user's transactions
    const filter = {
      user: req.user.userId,
    };

    // Type filter
    if (type) {
      filter.type = type;
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Amount filter
    if (minAmount || maxAmount) {
      filter.amount = {};

      if (minAmount) {
        filter.amount.$gte = Number(minAmount);
      }

      if (maxAmount) {
        filter.amount.$lte = Number(maxAmount);
      }
    }

    // Date filter
    if (startDate || endDate) {
      filter.date = {};

      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }

      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    // Pagination
    const currentPage = Math.max(Number(page), 1);

    const perPage = Math.min(
      Math.max(Number(limit), 1),
      100
    );

    const skip = (currentPage - 1) * perPage;

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(perPage),

      Expense.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / perPage);

    res.status(200).json({
      success: true,
      count: expenses.length,

      pagination: {
        total,
        page: currentPage,
        limit: perPage,
        totalPages,
      },

      data: expenses,
    });
  } catch (error) {
    next(error);
  }
};


// Update Transaction
export const updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const {
      title,
      amount,
      type,
      category,
      date,
      description,
    } = req.body;

    if (title !== undefined) {
      expense.title = title;
    }

    if (amount !== undefined) {
      expense.amount = amount;
    }

    if (type !== undefined) {
      expense.type = type;
    }

    if (category !== undefined) {
      expense.category = category;
    }

    if (date !== undefined) {
      expense.date = date;
    }

    if (description !== undefined) {
      expense.description = description;
    }

    await expense.save();

    res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};


// Delete Transaction
export const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findOneAndDelete({
      _id: id,
      user: req.user.userId,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};