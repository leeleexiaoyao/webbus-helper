import { BusinessError } from "./errors";

export function getErrorMessage(error: unknown, fallback = "操作失败，请稍后再试。"): string {
  if (error instanceof BusinessError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}
