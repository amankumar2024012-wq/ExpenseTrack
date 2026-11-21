import { z } from "zod";

export const createExpenseSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be less than 100 characters"),

  amount: z
    .number()
    .positive("Amount must be greater than 0"),

  type: z.enum(["income", "expense"]),

  category: z.enum([
    "food",
    "travel",
    "bills",
    "shopping",
    "other",
  ]),

  date: z
    .string()
    .datetime("Invalid date")
    .optional(),

  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

export const updateExpenseSchema =
  createExpenseSchema.partial();