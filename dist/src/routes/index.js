"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("../modules/auth/auth.routes"));
const saller_routes_1 = __importDefault(require("../modules/saller/saller.routes"));
const product_routes_1 = __importDefault(require("../modules/product/product.routes"));
const upload_routes_1 = __importDefault(require("../modules/upload/upload.routes"));
const category_routes_1 = __importDefault(require("../modules/category/category.routes"));
const brand_routes_1 = __importDefault(require("../modules/brand/brand.routes"));
const configCors = {
    origin: [
        "http://localhost:3000",
        "https://shop-one-bay.vercel.app",
        "https://seller-point.vercel.app",
        "http://localhost:3001",
    ],
};
const router = (0, express_1.Router)();
router.use("/auth", (0, cors_1.default)(configCors), auth_routes_1.default);
router.use("/saller", (0, cors_1.default)(configCors), saller_routes_1.default);
router.use("/commodity", (0, cors_1.default)(configCors), product_routes_1.default);
router.use("/upload", (0, cors_1.default)(configCors), upload_routes_1.default);
router.use("/category", (0, cors_1.default)(configCors), category_routes_1.default);
router.use("/brand", (0, cors_1.default)(configCors), brand_routes_1.default);
exports.default = router;
