import express from "express";

import {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
} from "../controllers/expenseController.js";

import { protect } from "../middleware/authMiddleware.js";

import {
  createExpenseSchema,
  updateExpenseSchema,
} from "../validators/expenseValidator.js";

import { validate } from "../middleware/validator.js";

const router = express.Router();

router.post(
  "/",
  protect,
  validate(createExpenseSchema),
  createExpense
);

router.get("/", protect, getExpenses);

router.put(
  "/:id",
  protect,
  validate(updateExpenseSchema),
  updateExpense
);

router.delete("/:id", protect, deleteExpense);

export default router;