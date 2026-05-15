import type { Role, Side } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  side: Side;
  role: Role;
  canApprove: boolean;
  title?: string;
};

export function isAdmin(user: SessionUser | null | undefined): boolean {
  return user?.role === "ADMIN";
}

export function canEdit(user: SessionUser | null | undefined): boolean {
  return user?.role === "ADMIN" || user?.role === "EDITOR";
}

export function canComment(user: SessionUser | null | undefined): boolean {
  return !!user;
}

export function canUpload(user: SessionUser | null | undefined): boolean {
  return canEdit(user);
}

export function canApproveSide(
  user: SessionUser | null | undefined,
  side: Side,
): boolean {
  if (!user) return false;
  if (!user.canApprove) return false;
  return user.side === side;
}

export function isReader(user: SessionUser | null | undefined): boolean {
  return !!user;
}

export function isNikaidoFamilyMember(
  user: SessionUser | null | undefined,
): boolean {
  return user?.side === "NIKAIDO" && user.role !== "VIEWER";
}

export function isOmoyInvestor(user: SessionUser | null | undefined): boolean {
  return user?.side === "OMOY" && user.role !== "VIEWER";
}

export function isBoardObserver(
  user: SessionUser | null | undefined,
): boolean {
  return user?.role === "VIEWER";
}

export function canSeeShareholderChamber(
  user: SessionUser | null | undefined,
): boolean {
  return isNikaidoFamilyMember(user) || isOmoyInvestor(user);
}
