import express, { Application, Request, Response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import blogRoutes from "./routes/blogRoutes";
import userRoutes from "./routes/userRoutes";
import tagRoutes from "./routes/tagRoutes";
import cookieParser from "cookie-parser";

dotenv.config();

const app: Application = express();
const PORT: string | number = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/blogs", blogRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tags", tagRoutes);

// Default route
app.get("/", (req: Request, res: Response) => {
  res.send("MERN Blogging Platform API");
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGODB_URI as string)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error: Error) => {
    console.error("MongoDB connection error:", error);
  });