import { z } from "zod";

export const searchUsersQuerySchema = z.object({
  query: z.string().min(1).max(255),
});

export const changeRoleBodySchema = z.object({
  role: z.enum(["GUEST", "HOST", "ADMIN"]),
});

export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
