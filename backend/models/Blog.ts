import { Schema, model, type Document, type Model, type Types } from "mongoose";

export interface IBlog extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  markdown: string;
  coverImage: string;
  tags: string[];
  author: Types.ObjectId;
  readTime: number;
  createdAt: Date;
  updatedAt: Date;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function readTimeOf(markdown: string): number {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

const blogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title must be at most 100 characters"],
    },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    markdown: { type: String, required: [true, "Content is required"] },
    coverImage: { type: String, default: "" },
    tags: { type: [String], default: [], index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    readTime: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// The slug must exist before validation runs, so it is derived in a
// pre('validate') hook rather than in pre('save').
blogSchema.pre("validate", async function () {
  if (this.isModified("title") || !this.slug) {
    const base = slugify(this.title || "") || "untitled";
    let candidate = base;
    let suffix = 1;

    // Loop instead of trusting a single lookup so concurrent posts stay unique.
    // eslint-disable-next-line no-await-in-loop
    while (
      await this.model("Blog").exists({
        slug: candidate,
        _id: { $ne: this._id },
      })
    ) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }

    this.slug = candidate;
  }
});

blogSchema.pre("save", async function () {
  if (this.isModified("markdown") || !this.readTime) {
    this.readTime = readTimeOf(this.markdown || "");
  }
});

blogSchema.index({ createdAt: -1 });
blogSchema.index({ title: "text", description: "text" });

const Blog: Model<IBlog> = model<IBlog>("Blog", blogSchema);

export default Blog;
