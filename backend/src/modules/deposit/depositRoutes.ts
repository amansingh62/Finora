import Router from "express";
import { isAuthenticated } from "../../middlewares/authMiddleware.js";
import { deposit, getDeposit, getDeposits } from "./depositController.js";

const router = Router();

router.get("/", isAuthenticated, getDeposits);
router.get("/:depositId", isAuthenticated, getDeposit);

router.post("/", isAuthenticated, deposit);

export default router;