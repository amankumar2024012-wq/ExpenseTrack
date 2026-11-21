import express from "express";

import {
  register,
  login,
  refreshAccessToken,
  logout
} from "../controllers/authController.js";

import {
  registerSchema,
  loginSchema
} from "../validators/authValidator.js";

import { validate } from "../middleware/validator.js";

const router = express.Router();

router.post(
  "/register",
  validate(registerSchema),
  register
);

router.post(
  "/login",
  validate(loginSchema),
  login
);

router.post(
  "/refresh",
  refreshAccessToken
);

router.post(
  "/logout",
  logout
);
export default router;