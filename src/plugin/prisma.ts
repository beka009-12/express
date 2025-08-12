import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();
prisma.$connect();

export default prisma;
