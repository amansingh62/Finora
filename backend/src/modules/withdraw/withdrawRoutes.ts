import Router from "express";
import { isAuthenticated } from "../../middlewares/authMiddleware.js";
import { getWithdrawal, getWithdrawals, withdrawMoney } from "./withdrawController.js";

const router = Router();

router.get("/", isAuthenticated, getWithdrawals);
router.get("/:id", isAuthenticated, getWithdrawal);

router.post("/", isAuthenticated, withdrawMoney);


export default router;