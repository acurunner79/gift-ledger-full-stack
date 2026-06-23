import "dotenv/config";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";

export type AuthTokenPayload = {
  userId: string;
  email: string;
};

const TOKEN_EXPIRES_IN: SignOptions["expiresIn"] = "7d";

function getJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not set");
  }

  return jwtSecret;
}

function isAuthTokenPayload(
  payload: string | JwtPayload
): payload is JwtPayload & AuthTokenPayload {
  return (
    typeof payload !== "string" &&
    typeof payload.userId === "string" &&
    typeof payload.email === "string"
  );
}

export function createAuthToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: TOKEN_EXPIRES_IN
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret());

  if (!isAuthTokenPayload(decoded)) {
    throw new Error("Invalid token payload");
  }

  return {
    userId: decoded.userId,
    email: decoded.email
  };
}