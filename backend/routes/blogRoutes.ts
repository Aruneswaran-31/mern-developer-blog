import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import Blog from "../models/Blog";
import User from "../models/User";
import Tag from "../models/Tag";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

// Middleware to attach user from token
router.use((req: Request, res: Response, next) => {
  if (req.headers.authorization?.startsWith("Bearer ")) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded: any = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      );
      req.user = { userId: decoded.userId, username: decoded.username };
    } catch (error) {
      // Not a valid token, continue without user
    }
  }
  next();
});

// Get all blogs (public)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { tag, search, page = 1, limit = 10 } = req.query;
    const query: any = {};

    // Tag filtering
    if (tag) {
      const tags = await Tag.find({ slug: tag });
      if (tags.length > 0) {
        query.tags = tags[0].slug;
      }
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search as string, $options: "i" } },
        { description: { $regex: search as string, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const blogs = await Blog.find(query)
      .populate("author", "username avatar bio")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Blog.countDocuments(query);

    res.status(200).json({
      blogs,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get single blog by slug (public)
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug }).populate(
      "author",
      "username avatar bio"
    );
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.status(200).json(blog);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create blog (protected)
router.post(
  "/",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { title, description, markdown, tags, coverImage } = req.body;

      if (!title || !description || !markdown) {
        return res.status(400).json({ message: "Required fields are missing" });
      }

      // Find or create tags
      const tagDocs = [];
      if (tags && Array.isArray(tags)) {
        for (const tagName of tags) {
          let tag = await Tag.findOne({ slug: tagName.toLowerCase() });
          if (!tag) {
            tag = new Tag({ name: tagName, slug: tagName.toLowerCase() });
          }
          tagDocs.push(tag._id);
          await tag.save();
        }
      }

      const user = await User.findById(req.user?.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const blog = new Blog({
        title,
        slug: title.toLowerCase().replace(/[^\w]+/g, "-"),
        description,
        markdown,
        tags: tagDocs,
        author: user._id,
        coverImage: coverImage || "",
      });

      await blog.save();

      // Add blog to user's blog list
      user.blogs.push(blog._id);
      await user.save();

      // Populate author info
      await blog.populate("author", "username avatar bio");

      res.status(201).json({
        message: "Blog created successfully",
        blog,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Update blog (protected, author only)
router.put(
  "/:slug",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const blog = await Blog.findOne({ slug: req.params.slug });
      if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
      }

      // Check if user is the author
      if (blog.author.toString() !== req.user?.userId) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this blog" });
      }

      const { title, description, markdown, tags, coverImage } = req.body;

      if (title) blog.title = title;
      if (description) blog.description = description;
      if (markdown) blog.markdown = markdown;
      if (coverImage !== undefined) blog.coverImage = coverImage;

      // Handle tags update
      if (tags && Array.isArray(tags)) {
        blog.tags = [];
        for (const tagName of tags) {
          let tag = await Tag.findOne({ slug: tagName.toLowerCase() });
          if (!tag) {
            tag = new Tag({ name: tagName, slug: tagName.toLowerCase() });
          }
          blog.tags.push(tag._id);
          await tag.save();
        }
      }

      await blog.save();
      await blog.populate("author", "username avatar bio");

      res.status(200).json({
        message: "Blog updated successfully",
        blog,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete blog (protected, author only)
router.delete(
  "/:slug",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const blog = await Blog.findOne({ slug: req.params.slug });
      if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
      }

      // Check if user is the author
      if (blog.author.toString() !== req.user?.userId) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this blog" });
      }

      await Blog.deleteOne({ slug: req.params.slug });
      res.status(200).json({ message: "Blog deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;