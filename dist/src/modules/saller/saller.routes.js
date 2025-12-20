"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sallerRouter = __importStar(require("./saller.controllers"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const multer_1 = require("../../plugin/multer");
const router = (0, express_1.Router)();
// todo Защищённый маршрут
// ! POST
router.post("/sign-up-saller", sallerRouter.signUpSeller);
router.post("/sign-in-saller", sallerRouter.signInSeller);
router.post("/logout-seller", auth_middleware_1.authMiddleware, sallerRouter.logautSeller);
// ! GET
router.get("/saller-profile", auth_middleware_1.authMiddleware, sallerRouter.getProfileSaller);
// ! STORE
router.post("/create-store", auth_middleware_1.authMiddleware, sallerRouter.createStore);
router.post("/upload-store-logo", multer_1.upload.single("file"), sallerRouter.uploadStoreLogo);
router.get("/my-store", auth_middleware_1.authMiddleware, sallerRouter.getMyStore);
exports.default = router;
