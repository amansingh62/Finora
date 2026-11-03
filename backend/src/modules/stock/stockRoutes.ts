import Router from "express";
import { getAllStocks, getStock, stockSearch, trendingStocks } from "./stockController.js";

const router = Router();

router.get("/", getAllStocks);
router.get("/search", stockSearch);
router.get("/trending", trendingStocks);
router.get("/:symbol", getStock);

export default router;