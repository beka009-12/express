"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("../../plugin/supabase");
const uuid_1 = require("uuid");
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const ext = req.file.originalname.split(".").pop();
        const fileName = `${Date.now()}-${(0, uuid_1.v4)()}.${ext}`;
        const { data, error } = await supabase_1.supabase.storage
            .from("product-image")
            .upload(`uploads/${fileName}`, req.file.buffer, {
            contentType: req.file.mimetype,
        });
        if (error)
            throw error;
        res.status(200).json({
            name: fileName,
            url: `${process.env.SUPABASE_URL}/storage/v1/object/public/${data.path}`,
        });
    }
    catch (error) {
        res.status(500).json({
            message: `Error uploading file`,
            error: error.message,
        });
    }
};
const uploadMultipleFiles = async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ message: "No files uploaded" });
        }
        const uploadPromises = files.map(async (file) => {
            const ext = file.originalname.split(".").pop();
            const fileName = `${Date.now()}-${(0, uuid_1.v4)()}.${ext}`;
            const { data, error } = await supabase_1.supabase.storage
                .from("product-image")
                .upload(`uploads/${fileName}`, file.buffer, {
                contentType: file.mimetype,
            });
            if (error) {
                return { name: file.originalname, error: error.message };
            }
            return {
                name: fileName,
                url: `${process.env.SUPABASE_URL}/storage/v1/object/public/${data.path}`,
            };
        });
        const uploadedFiles = await Promise.all(uploadPromises);
        res.status(200).json(uploadedFiles);
    }
    catch (error) {
        res.status(500).json({
            message: "Error in uploadMultipleFiles",
            error: error.message,
        });
    }
};
exports.default = { uploadFile, uploadMultipleFiles };
