import { Request, Response } from "express";
import { supabase } from "../../plugin/supabase";
import { v4 as uuidv4 } from "uuid";

const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const ext = req.file.originalname.split(".").pop();
    const fileName = `${Date.now()}-${uuidv4()}.${ext}`;

    const { data, error } = await supabase.storage
      .from("product-image")
      .upload(`uploads/${fileName}`, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (error) throw error;

    res.status(200).json({
      name: fileName,
      url: `${process.env.SUPABASE_URL}/storage/v1/object/public/${data.path}`,
    });
  } catch (error) {
    res.status(500).json({
      message: `Error uploading file`,
      error: (error as Error).message,
    });
  }
};

const uploadMultipleFiles = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadPromises = files.map(async (file) => {
      const ext = file.originalname.split(".").pop();
      const fileName = `${Date.now()}-${uuidv4()}.${ext}`;

      const { data, error } = await supabase.storage
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
  } catch (error) {
    res.status(500).json({
      message: "Error in uploadMultipleFiles",
      error: (error as Error).message,
    });
  }
};

export default { uploadFile, uploadMultipleFiles };
