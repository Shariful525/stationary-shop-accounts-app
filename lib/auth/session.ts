import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { RoleType, Permission } from "@prisma/client";

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "fallback-super-secret-key-stationary-app-minimum-32-characters"
);

const SESSION_COOKIE_NAME = "shop_session_token";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  userId: string;
  email: string;
  roleType: RoleType;
  expiresAt: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  roleType: RoleType;
  roleName?: string;
  permissions: Permission[];
  avatarUrl: string | null;
  isActive: boolean;
}

/**
 * Encrypt and sign a session JWT
 */
export async function signSessionToken(payload: Omit<SessionPayload, "expiresAt">): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  return new SignJWT({ ...payload, expiresAt })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(SECRET_KEY);
}

/**
 * Verify a session JWT
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Set HTTP-only secure cookie
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get current session payload from cookies
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Retrieve fully populated user details with permissions
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession();
  if (!session?.userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        role: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    // User explicit permissions take precedence over role defaults
    const rolePermissions = user.role?.permissions || [];
    const directPermissions = user.permissions || [];
    const allPermissions =
      user.roleType === RoleType.SUPER_ADMIN
        ? Object.values(Permission)
        : directPermissions.length > 0
        ? directPermissions
        : rolePermissions;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      roleType: user.roleType,
      roleName: user.role?.name || user.roleType,
      permissions: allPermissions,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
    };
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}
