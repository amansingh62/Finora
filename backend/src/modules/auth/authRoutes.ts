import Router from "express";
import { login, me, refresh, register } from "./authController.js";
import { isAuthenticated } from "../../middlewares/authMiddleware.js";

const router = Router();

router.get("/me", isAuthenticated, me);
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", isAuthenticated, refresh);

export default router;