import prisma from "@/prisma";
import type { Role } from "@prisma/client";
import { AppError } from "@/util/appError";
import { AdminErrorCode } from "./admin.error";
import {
  toAdminWeddingListItem,
  toAdminUserSearchResult,
  type AdminWeddingListItem,
  type AdminUserSearchResult,
} from "./admin.types";

export async function getAllWeddings(): Promise<AdminWeddingListItem[]> {
  const weddings = await prisma.wedding.findMany({
    where: { deletedAt: null },
    include: { couples: true },
    orderBy: { id: "desc" },
  });

  return weddings.map(toAdminWeddingListItem);
}

export async function searchUsers(query: string): Promise<AdminUserSearchResult[]> {
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      OR: [
        { email: { contains: query, mode: "insensitive" } },
        { nickname: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { id: "desc" },
    take: 20,
  });

  return users.map(toAdminUserSearchResult);
}

export async function changeUserRole(
  adminUserId: number,
  targetUserId: number,
  newRole: Role,
): Promise<AdminUserSearchResult> {
  if (adminUserId === targetUserId) {
    throw AppError.from(AdminErrorCode.ADMIN_CANNOT_CHANGE_OWN_ROLE);
  }

  const targetUser = await prisma.user.findFirst({
    where: { id: targetUserId, deletedAt: null },
  });
  if (!targetUser) {
    throw AppError.from(AdminErrorCode.ADMIN_USER_NOT_FOUND);
  }

  const [updated] = await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUserId, version: targetUser.version },
      data: { role: newRole, version: { increment: 1 } },
    }),
    prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "ROLE_CHANGE",
        targetType: "USER",
        targetId: targetUserId,
        meta: { from: targetUser.role, to: newRole },
      },
    }),
  ]);

  return toAdminUserSearchResult(updated);
}
