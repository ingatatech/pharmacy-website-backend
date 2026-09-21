import bcrypt from "bcrypt";
import { prisma } from "../prisma";
import { CreateUserInput, UpdateUserInput } from "../validators/user.validator";

const SALT_ROUNDS = 10;

export async function findAll() {
  return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
}

export async function create(data: CreateUserInput) {
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  return prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      passwordHash,
    },
  });
}

export async function update(id: string, data: UpdateUserInput) {
  const { password, ...rest } = data;

  return prisma.user.update({
    where: { id },
    data: {
      ...rest,
      ...(password ? { passwordHash: await bcrypt.hash(password, SALT_ROUNDS) } : {}),
    },
  });
}

export async function remove(id: string) {
  return prisma.user.delete({ where: { id } });
}
