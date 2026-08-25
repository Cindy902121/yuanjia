export const CLIENT_CODE_PATTERN = /^[ZEW][0-9]{6}$/;

export function isClientCode(value: unknown): value is string {
  return typeof value === "string" && CLIENT_CODE_PATTERN.test(value);
}

/**
 * B2B uses the client code in the UI, while Supabase Auth still needs a
 * unique email identity behind the server-side login route.
 */
export function internalB2bAuthEmail(clientCode: string) {
  return `b2b.${clientCode.toLowerCase()}@auth.yuanjia.invalid`;
}
