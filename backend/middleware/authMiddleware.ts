import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthPayload {
  userId: string;
  username: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
}

/** Reject the request unless it carries a valid bearer token. */
export default function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = header.slice(7).trim();
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as
      | AuthPayload
      | jwt.JwtPayload;

    if (!("userId" in decoded) || !decoded.userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = {
      userId: String(decoded.userId),
      username: String(decoded.username ?? ""),
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
