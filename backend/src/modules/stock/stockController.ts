import type { Request, Response } from "express";
import { prisma } from "../../../lib/prisma.js";

export const getAllStocks = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const [stocks, totalStocks] = await prisma.$transaction([
      prisma.stock.findMany({
        where: {
          isActive: true,
        },

        select: {
          id: true,
          name: true,
          symbol: true,
          exchange: true,
          sector: true,

          quote: {
            select: {
              currentPrice: true,
              open: true,
              high: true,
              low: true,
              previousClose: true,
              volume: true,
              marketCapt: true,
              peRatio: true,
              eps: true,
              dividendYeild: true,
              asOf: true,
            },
          },

          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  key: true,
                  name: true,
                },
              },
            },
          },
        },

        orderBy: {
          name: "asc",
        },

        skip,
        take: limit,
      }),

      prisma.stock.count({
        where: {
          isActive: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalStocks / limit);

    const formattedStocks = stocks.map((stock) => ({
      ...stock,
      quote: stock.quote
        ? {
            ...stock.quote,
            volume: stock.quote.volume.toString(),
          }
        : null,
    }));

    return res.status(200).json({
      message: "Stocks fetched successfully",

      data: formattedStocks,

      pagination: {
        currentPage: page,
        limit,
        totalStocks,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get All Stocks Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getStock = async (req: Request, res: Response) => {
  try {
    const rawSymbol = req.params.symbol;

    if (typeof rawSymbol !== "string" || !rawSymbol.trim()) {
      return res.status(400).json({
        message: "Invalid stock symbol",
      });
    }

    const symbol = rawSymbol.trim().toUpperCase();

    if (!symbol) {
      return res.status(400).json({
        message: "Invalid stock symbol",
      });
    }

    const stock = await prisma.stock.findFirst({
      where: {
        symbol,
        isActive: true,
      },

      select: {
        id: true,
        name: true,
        symbol: true,
        exchange: true,
        sector: true,

        quote: {
          select: {
            currentPrice: true,
            open: true,
            high: true,
            low: true,
            previousClose: true,
            volume: true,
            marketCapt: true,
            peRatio: true,
            eps: true,
            dividendYeild: true,
            asOf: true,
          },
        },

        categories: {
          select: {
            category: {
              select: {
                id: true,
                key: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!stock) {
      return res.status(404).json({
        message: "Stock not found",
      });
    }

    const currentPrice = Number(stock.quote?.currentPrice ?? 0);
    const previousClose = Number(stock.quote?.previousClose ?? 0);

    const priceChange = stock.quote ? currentPrice - previousClose : null;

    const priceChangePercentage =
      stock.quote && previousClose !== 0
        ? (priceChange! / previousClose) * 100
        : null;

    const formattedStock = {
      ...stock,

      quote: stock.quote
        ? {
            ...stock.quote,
            volume: stock.quote.volume.toString(),
          }
        : null,

      priceChange,
      priceChangePercentage,
    };

    return res.status(200).json({
      message: "Stock fetched successfully",
      data: formattedStock,
    });
  } catch (error) {
    console.error("Get Stock Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const stockSearch = async (req: Request, res: Response) => {
  try {
    const rawQuery = req.query.q;

    if (typeof rawQuery !== "string" || !rawQuery.trim()) {
      return res.status(400).json({
        message: "Search query is required",
      });
    }

    const query = rawQuery.trim();
    const normalizedSymbol = query.toUpperCase();

    const stocks = await prisma.stock.findMany({
      where: {
        isActive: true,
        OR: [
          {
            symbol: {
              contains: normalizedSymbol,
            },
          },
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },

      select: {
        id: true,
        name: true,
        symbol: true,
        exchange: true,
        sector: true,

        quote: {
          select: {
            currentPrice: true,
            open: true,
            high: true,
            low: true,
            previousClose: true,
            volume: true,
            marketCapt: true,
            peRatio: true,
            eps: true,
            dividendYeild: true,
            asOf: true,
          },
        },
      },

      take: 10,
    });

    stocks.sort((a, b) => {
      const aExact = a.symbol === normalizedSymbol ? 1 : 0;
      const bExact = b.symbol === normalizedSymbol ? 1 : 0;

      return bExact - aExact;
    });

    const formattedStocks = stocks.map((item) => ({
      ...item,
      quote: item.quote
        ? {
            ...item.quote,
            volume: item.quote.volume.toString(),
          }
        : null,
    }));

    return res.status(200).json({
      message: "Stocks fetched successfully",
      count: formattedStocks.length,
      data: formattedStocks,
    });
  } catch (error) {
    console.error("Stock Search Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const trendingStocks = async (req: Request, res: Response) => {
  try {
    const rawLimit = req.query.limit;

    if (rawLimit !== undefined && typeof rawLimit !== "string") {
      return res.status(400).json({
        message: "Invalid limit",
      });
    }

    const limit = Math.min(Math.max(Number(rawLimit) || 10, 1), 50);

    const stocks = await prisma.stock.findMany({
      where: {
        isActive: true,
        quote: {
          isNot: null,
        },
      },

      select: {
        id: true,
        name: true,
        symbol: true,
        exchange: true,
        sector: true,

        quote: {
          select: {
            currentPrice: true,
            open: true,
            high: true,
            low: true,
            previousClose: true,
            volume: true,
            marketCapt: true,
            peRatio: true,
            eps: true,
            dividendYeild: true,
            asOf: true,
          },
        },
      },
    });

    const formattedStocks = stocks
      .filter((stock) => {
        return stock.quote !== null && Number(stock.quote.previousClose) !== 0;
      })
      .map((stock) => {
        const currentPrice = Number(stock.quote!.currentPrice);
        const previousClose = Number(stock.quote!.previousClose);

        const priceChange = currentPrice - previousClose;

        const priceChangePercentage = (priceChange / previousClose) * 100;

        return {
          ...stock,

          quote: {
            ...stock.quote!,
            volume: stock.quote!.volume.toString(),
          },

          priceChange,
          priceChangePercentage,
        };
      });

    formattedStocks.sort((a, b) => {
      const percentageDifference =
        Math.abs(b.priceChangePercentage) - Math.abs(a.priceChangePercentage);

      if (percentageDifference !== 0) {
        return percentageDifference;
      }

      return Number(b.quote.volume) - Number(a.quote.volume);
    });

    const trending = formattedStocks.slice(0, limit);

    return res.status(200).json({
      message: "Trending stocks fetched successfully",
      count: trending.length,
      data: trending,
    });
  } catch (error) {
    console.error("Trending Stocks Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
