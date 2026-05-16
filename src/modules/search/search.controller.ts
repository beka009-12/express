import { Request, Response } from "express";
import { searchProductsService, getSuggestionsService } from "./search.service";

const searchProducts = async (req: Request, res: Response) => {
  try {
    const result = await searchProductsService(
      req.query as Record<string, string>,
    );
    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getSearchSuggestions = async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q ?? "");
    const limit = req.query.limit ? Math.min(20, Number(req.query.limit)) : 8;
    const result = await getSuggestionsService(q, limit);
    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export { searchProducts, getSearchSuggestions };
