import Router from "express";
import { isAuthenticated } from "../../middlewares/authMiddleware.js";
import { getAllBankAccounts, getBankAccount, linkBankAccount, makePrimaryAccount, unlinkBankAccount } from "./bankController.js";

const router = Router();

router.get("/", isAuthenticated, getAllBankAccounts);
router.get("/:id", isAuthenticated, getBankAccount);

router.post("/", isAuthenticated, linkBankAccount);
router.patch("/:id/primary", isAuthenticated, makePrimaryAccount);
router.delete("/:id", isAuthenticated, unlinkBankAccount);


export default router;