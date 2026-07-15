import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "./config";
import { NextRequest } from "next/server";

/**
 * Session type returned by getServerSession — does NOT include accessToken.
 * Use getServerAccessToken() to retrieve the token server-side.
 */
export interface ServerSession {
  user: {
    githubId: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

/**
 * Gets the authenticated session (server components / API routes).
 * Does NOT include the accessToken — use getServerAccessToken() for that.
 */
export async function getAuthSession(): Promise<ServerSession | null> {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  return session as unknown as ServerSession;
}

/**
 * Gets the GitHub access token from the JWT — server-side ONLY.
 * This token is NEVER sent to the browser.
 *
 * For API route handlers, pass the request object.
 * For server components, pass undefined (reads from cookies).
 */
export async function getServerAccessToken(
  request?: NextRequest
): Promise<string | null> {
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  });

  return (token?.accessToken as string) || null;
}
