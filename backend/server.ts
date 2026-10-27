import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import blogRoutes from "./routes/blogRoutes";
import userRoutes from "./routes/userRoutes";
import tagRoutes from "./routes/tagRoutes";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = process.env.MONGODB_URI;
const isProduction = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(",") ?? true,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    database: mongoose.connection.readyState === 1 ? "connected" : "down",
  });
});

app.use("/api/blogs", blogRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tags", tagRoutes);

app.use("/api", (_req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// Serve the built React app when running in production.
if (isProduction) {
  const clientDir = path.resolve(process.cwd(), "dist");
  app.use(express.static(clientDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDir, "index.html"));
  });
}

async function start() {
  if (!MONGODB_URI) {
    console.error(
      "MONGODB_URI is not set. Copy .env.example to .env and add your connection string."
    );
    process.exit(1);
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not set. Add one to your .env file.");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start the API:", error);
  process.exit(1);
});
