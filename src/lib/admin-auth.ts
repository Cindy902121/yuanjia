import { apiError } from "./api";
import { getAdminContext } from "./auth-context";

async function requireAdminRole(allowedRoles: readonly ("admin" | "business_staff")[]) {
  const context = await getAdminContext();

  if (!context.user) {
    return { response: apiError("請先登入管理者帳號。", 401) };
  }
  if (context.configurationError || context.databaseError) {
    return { response: apiError("目前無法確認管理者權限。", 503) };
  }
  if (!context.role || !allowedRoles.includes(context.role)) {
    return { response: apiError("你沒有管理者權限。", 403) };
  }

  return { context };
}

export function requireAdmin() {
  return requireAdminRole(["admin"]);
}

export function requireBusinessAdmin() {
  return requireAdminRole(["admin", "business_staff"]);
}
