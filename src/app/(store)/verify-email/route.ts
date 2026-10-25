import { NextResponse, type NextRequest } from "next/server";
import { consumeToken, markEmailVerified } from "@/lib/auth/accounts";
import { env } from "@/lib/env";

/** Link from the verification email. Verifies the address, links past guest orders, then lands on the account page. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const userId = token ? await consumeToken(token, "verify_email") : null;
  if (!userId) return NextResponse.redirect(`${env.appUrl}/account?verified=invalid`);
  const result = await markEmailVerified(userId);
  return NextResponse.redirect(`${env.appUrl}/account?verified=1&linked=${result?.linked ?? 0}`);
}
