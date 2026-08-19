import { randomInt } from "node:crypto";

export const CLIENT_CODE_PREFIXES = ["Z", "E", "W"] as const;
export type ClientCodePrefix = (typeof CLIENT_CODE_PREFIXES)[number];

export const CLIENT_CODE_PATTERN = /^[ZEW][0-9]{6}$/;

export function isClientCode(value: unknown): value is string {
  return typeof value === "string" && CLIENT_CODE_PATTERN.test(value);
}

export function isClientCodePrefix(value: unknown): value is ClientCodePrefix {
  return (
    typeof value === "string" &&
    (CLIENT_CODE_PREFIXES as readonly string[]).includes(value)
  );
}

export function generateClientCode(prefix: ClientCodePrefix) {
  return `${prefix}${String(randomInt(0, 1_000_000)).padStart(6, "0")}`;
}

/**
 * B2B uses the client code in the UI, while Supabase Auth still needs a
 * unique email identity behind the server-side login route.
 */
export function internalB2bAuthEmail(clientCode: string) {
  return `b2b.${clientCode.toLowerCase()}@auth.yuanjia.invalid`;
}
