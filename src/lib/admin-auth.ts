import { apiError } from "./api";
import { getAdminContext } from "./auth-context";

export async function requireAdmin() {
  const context = await getAdminContext();

  if (!context.user) {
    return { response: apiError("請先登入管理者帳號。", 401) };
  }
  if (context.configurationError || context.databaseError) {
    return { response: apiError("目前無法確認管理者權限。", 503) };
  }
  if (!context.isAdmin) {
    return { response: apiError("你沒有管理者權限。", 403) };
  }

  return { context };
}

export async function requireBusinessAdmin() {
  const context = await getAdminContext();

  if (!context.user) {
    return { response: apiError("請先登入管理者帳號。", 401) };
  }
  if (context.configurationError || context.databaseError) {
    return { response: apiError("目前無法確認管理者權限。", 503) };
  }
  if (!context.isAdmin && !context.isBusinessStaff) {
    return { response: apiError("你沒有 B2B 管理權限。", 403) };
  }

  return { context };
}
