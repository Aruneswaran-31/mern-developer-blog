import express from "express";
import Blog from "../models/Blog";
import User from "../models/User";
import Tag from "../models/Tag";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

/** Normalise an incoming tag list to lowercase slugs. */
function normaliseTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return [
    ...new Set(
      tags
        .map((tag) => String(tag).trim().toLowerCase().replace(/\s+/g, "-"))
        .filter(Boolean)
    ),
  ].slice(0, 5);
}

/** Keep the Tag collection in sync with the tags used on articles. */
async function upsertTags(tags: string[]) {
  await Promise.all(
    tags.map((slug) =>
      Tag.updateOne(
        { slug },
        { $setOnInsert: { slug, name: slug } },
        { upsert: true }
      )
    )
  );
}

// GET /api/blogs?tag=&search=&page=&limit=
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 9));
    const filter: Record<string, unknown> = {};

    const tag = String(req.query.tag ?? "").trim().toLowerCase();
    if (tag) filter.tags = tag;

    const search = String(req.query.search ?? "").trim();
    if (search) {
      const pattern = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      filter.$or = [
        { title: pattern },
        { description: pattern },
        { tags: pattern },
      ];
    }

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .populate("author", "username avatar bio")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    return res.status(200).json({
      blogs,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch {
    return res.status(500).json({ message: "Could not load articles" });
  }
});

// GET /api/blogs/:slug
router.get("/:slug", async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug })
      .populate("author", "username avatar bio")
      .lean();

    if (!blog) return res.status(404).json({ message: "Blog not found" });
    return res.status(200).json(blog);
  } catch {
    return res.status(500).json({ message: "Could not load the article" });
  }
});

// POST /api/blogs (protected)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, markdown, coverImage } = req.body ?? {};

    if (!title || !description || !markdown) {
      return res
        .status(400)
        .json({ message: "Title, description and content are required" });
    }

    const tags = normaliseTags(req.body?.tags);

    const blog = await Blog.create({
      title: String(title),
      description: String(description),
      markdown: String(markdown),
      coverImage: coverImage ? String(coverImage) : "",
      tags,
      author: req.user!.userId,
    });

    await Promise.all([
      upsertTags(tags),
      User.updateOne({ _id: req.user!.userId }, { $push: { blogs: blog._id } }),
    ]);

    await blog.populate("author", "username avatar bio");

    return res.status(201).json({ message: "Blog created successfully", blog });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create the article";
    return res.status(400).json({ message });
  }
});

// PUT /api/blogs/:slug (protected, author only)
router.put("/:slug", authMiddleware, async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (String(blog.author) !== req.user!.userId) {
      return res
        .status(403)
        .json({ message: "You can only edit your own articles" });
    }

    const { title, description, markdown, coverImage } = req.body ?? {};

    if (title !== undefined) blog.title = String(title);
    if (description !== undefined) blog.description = String(description);
    if (markdown !== undefined) blog.markdown = String(markdown);
    if (coverImage !== undefined) blog.coverImage = String(coverImage);

    if (req.body?.tags !== undefined) {
      const tags = normaliseTags(req.body.tags);
      blog.tags = tags;
      await upsertTags(tags);
    }

    await blog.save();
    await blog.populate("author", "username avatar bio");

    return res.status(200).json({ message: "Blog updated successfully", blog });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update the article";
    return res.status(400).json({ message });
  }
});

// DELETE /api/blogs/:slug (protected, author only)
router.delete("/:slug", authMiddleware, async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (String(blog.author) !== req.user!.userId) {
      return res
        .status(403)
        .json({ message: "You can only delete your own articles" });
    }

    await Promise.all([
      Blog.deleteOne({ _id: blog._id }),
      User.updateOne(
        { _id: req.user!.userId },
        { $pull: { blogs: blog._id } }
      ),
    ]);

    return res.status(200).json({ message: "Blog deleted successfully" });
  } catch {
    return res.status(500).json({ message: "Could not delete the article" });
  }
});

export default router;
