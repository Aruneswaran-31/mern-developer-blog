import express, { Request, Response } from "express";
import Tag from "../models/Tag";

const router = express.Router();

// Get all tags
router.get("/", async (req: Request, res: Response) => {
  try {
    const tags = await Tag.find().sort({ name: 1 });
    res.status(200).json(tags);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get blog posts by tag
router.get("/:slug/blogs", async (req: Request, res: Response) => {
  try {
    const tag = await Tag.findOne({ slug: req.params.slug });
    if (!tag) {
      return res.status(404).json({ message: "Tag not found" });
    }

    const blogs = await Blog.find({ tags: tag._id })
      .populate("author", "username avatar bio")
      .sort({ createdAt: -1 });

    res.status(200).json({ tag, blogs });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;