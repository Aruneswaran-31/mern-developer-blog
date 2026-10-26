import jwt from "jsonwebtoken";

export const authMiddleware = (req: any, res: Response, next: Function) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    );

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
    };

    next();
  } catch (error: any) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};