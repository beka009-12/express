import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { AddressService } from "./address.service";
import { CreateAddressDto, UpdateAddressDto } from "./address.validation";

const createAddress = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = CreateAddressDto.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }

    const address = await AddressService.createAddress(req.user!.id, parsed.data);
    return res.status(201).json({ message: "Адрес добавлен", address });
  } catch (error) {
    console.error("createAddress error:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const getAddresses = async (req: AuthRequest, res: Response) => {
  try {
    const addresses = await AddressService.getAddresses(req.user!.id);
    return res.status(200).json({ addresses });
  } catch (error) {
    console.error("getAddresses error:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const updateAddress = async (req: AuthRequest, res: Response) => {
  try {
    const addressId = Number(req.params.id);

    if (!addressId || isNaN(addressId)) {
      return res.status(400).json({ message: "Неверный ID адреса" });
    }

    const parsed = UpdateAddressDto.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }

    const address = await AddressService.updateAddress(req.user!.id, addressId, parsed.data);
    return res.status(200).json({ message: "Адрес обновлён", address });
  } catch (error: any) {
    console.error("updateAddress error:", error);

    if (error.message.includes("не найден")) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "Нет доступа") {
      return res.status(403).json({ message: error.message });
    }

    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const deleteAddress = async (req: AuthRequest, res: Response) => {
  try {
    const addressId = Number(req.params.id);

    if (!addressId || isNaN(addressId)) {
      return res.status(400).json({ message: "Неверный ID адреса" });
    }

    const result = await AddressService.deleteAddress(req.user!.id, addressId);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("deleteAddress error:", error);

    if (error.message.includes("не найден")) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "Нет доступа") {
      return res.status(403).json({ message: error.message });
    }

    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

const setDefault = async (req: AuthRequest, res: Response) => {
  try {
    const addressId = Number(req.params.id);

    if (!addressId || isNaN(addressId)) {
      return res.status(400).json({ message: "Неверный ID адреса" });
    }

    const address = await AddressService.setDefault(req.user!.id, addressId);
    return res.status(200).json({ message: "Адрес установлен как основной", address });
  } catch (error: any) {
    console.error("setDefault error:", error);

    if (error.message.includes("не найден")) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "Нет доступа") {
      return res.status(403).json({ message: error.message });
    }

    return res.status(500).json({ message: "Ошибка сервера" });
  }
};

export { createAddress, getAddresses, updateAddress, deleteAddress, setDefault };
