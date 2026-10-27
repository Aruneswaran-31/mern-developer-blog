import express from "express";
import Tag from "../models/Tag";
import Blog from "../models/Blog";

const router = express.Router();

// GET /api/tags
router.get("/", async (_req, res) => {
  try {
    const tags = await Tag.find().sort({ name: 1 }).lean();
    return res.status(200).json(
      tags.map((tag) => ({ name: tag.name, slug: tag.slug }))
    );
  } catch {
    return res.status(500).json({ message: "Could not load tags" });
  }
});

// GET /api/tags/:slug/blogs
router.get("/:slug/blogs", async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase();

    const [tag, blogs] = await Promise.all([
      Tag.findOne({ slug }).lean(),
      Blog.find({ tags: slug })
        .populate("author", "username avatar bio")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    if (!tag && blogs.length === 0) {
      return res.status(404).json({ message: "Tag not found" });
    }

    return res.status(200).json({ tag, blogs });
  } catch {
    return res.status(500).json({ message: "Could not load the tag" });
  }
});

export default router;
