import { handler, ok } from "@/lib/api";
import { destroySessionCookie } from "@/lib/auth";

export const POST = handler(async () => {
  await destroySessionCookie();
  return ok({ loggedOut: true });
});
