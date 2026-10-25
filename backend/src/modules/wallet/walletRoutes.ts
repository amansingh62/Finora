import Router from "express";
import { getWallet, summary } from "./walletController.js";
import { isAuthenticated } from "../../middlewares/authMiddleware.js";

const router = Router();

router.get("/", isAuthenticated, getWallet);
router.get("/available", isAuthenticated, summary);

export default router;