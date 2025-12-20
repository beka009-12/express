"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_controller_1 = __importDefault(require("./upload.controller"));
const multer_1 = require("../../plugin/multer");
const router = (0, express_1.Router)();
router.post("/file", multer_1.upload.single("file"), upload_controller_1.default.uploadFile);
router.post("/files", multer_1.upload.array("files", 10), upload_controller_1.default.uploadMultipleFiles);
// ! store-upload
exports.default = router;
