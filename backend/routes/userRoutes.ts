import express from "express";
import User from "../models/User";
import Blog from "../models/Blog";
import authMiddleware, { signToken } from "../middleware/authMiddleware";

const router = express.Router();

const publicUser = (user: {
  _id: unknown;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
}) => ({
  id: String(user._id),
  username: user.username,
  email: user.email,
  bio: user.bio ?? "",
  avatar: user.avatar ?? "",
});

// POST /api/users/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body ?? {};

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (String(password).length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({
      $or: [
        { email: String(email).toLowerCase() },
        { username: String(username).trim() },
      ],
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "An account with that email or username exists" });
    }

    // The model hashes the password in a pre-save hook — pass it in plain.
    const user = await User.create({
      username: String(username).trim(),
      email: String(email).toLowerCase(),
      password,
    });

    const token = signToken({
      userId: String(user._id),
      username: user.username,
    });

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    // Unique index race: another request created the account first.
    if ((error as { code?: number }).code === 11000) {
      return res
        .status(400)
        .json({ message: "An account with that email or username exists" });
    }

    const message = error instanceof Error ? error.message : "Server error";
    return res.status(500).json({ message });
  }
});

// POST /api/users/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({
      email: String(email).toLowerCase(),
    }).select("+password");

    if (!user || !(await user.comparePassword(String(password)))) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = signToken({
      userId: String(user._id),
      username: user.username,
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return res.status(500).json({ message });
  }
});

// GET /api/users/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(publicUser(user));
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/users/:username — public profile with the author's articles
router.get("/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: "Profile not found" });

    const blogs = await Blog.find({ author: user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      user: {
        _id: String(user._id),
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
      },
      blogs,
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
