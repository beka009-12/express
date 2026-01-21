import { Router } from "express";
import * as productControllers from "../product/product.controllers";
import { authMiddleware } from "../../middleware/auth.middleware";
import multer from "multer";

const router = Router();
//! create
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/create-product",
  authMiddleware,
  upload.array("images", 6),
  productControllers.createProduct,
);

//! get
router.get("/products", authMiddleware, productControllers.getProduct);
router.get("/products-for-user", productControllers.getAllProductsForUsers);
router.get(
  "/products-by-category/:categoryId",
  productControllers.getProductsByCategory,
);
//! get-by-id
router.get(
  "/product-for-user/:id",
  authMiddleware,
  productControllers.getProductById,
);
//!  update
router.patch(
  "/product-update/:id",
  authMiddleware,
  productControllers.updateProduct,
);
//! delete
router.delete(
  "/product-delete/:id",
  authMiddleware,
  productControllers.deleteProduct,
);

export default router;
