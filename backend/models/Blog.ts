import mongoose, { Schema, model } from "mongoose";
import User from "./User";

interface IBlog {
  title: string;
  slug: string;
  description: string;
  markdown: string;
  coverImage?: string;
  tags: string[];
  author: typeof User;
  publishedAt?: Date;
  readTime?: number;
}

const blogSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title must be at most 100 characters"],
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    markdown: {
      type: String,
      required: [true, "Markdown content is required"],
    },
    coverImage: {
      type: String,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    readTime: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Generate slug from title before saving
blogSchema.pre("save", async function (next) {
  const blog = this as any;
  if (!blog.isModified("title")) return next();

  // Simple slug generation
  const slug = blog.title
    .toLowerCase()
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Check for unique slug
  const existingBlog = await Blog.findOne({ slug });
  if (existingBlog) {
    blog.slug = `${slug}-${Date.now()}`;
  } else {
    blog.slug = slug;
  }
  next();
});

// Calculate read time based on word count (average reading speed: 200 words/min)
blogSchema.methods.calculateReadTime = function (): number {
  const words = this.markdown
    .split(/\s+/)
    .filter((word: string) => word.length > 0);
  this.readTime = Math.max(1, Math.ceil(words.length / 200));
};

const Blog = model<IBlog>("Blog", blogSchema);

export default Blog;