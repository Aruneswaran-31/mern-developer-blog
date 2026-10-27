import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import { formatDate } from "../lib/format";
import type { Blog } from "../types";

interface BlogCardProps {
  blog: Blog;
  featured?: boolean;
}

export default function BlogCard({ blog, featured = false }: BlogCardProps) {
  return (
    <article
      className={`group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/60 ${
        featured ? "sm:p-7" : ""
      }`}
    >
      <div className="mb-3 flex flex-wrap gap-1.5">
        {blog.tags.slice(0, featured ? 4 : 3).map((tag) => (
          <Link
            key={tag}
            to={`/?tag=${encodeURIComponent(tag)}`}
            className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-indigo-600 uppercase transition hover:bg-indigo-100"
          >
            #{tag}
          </Link>
        ))}
      </div>

      <h3
        className={`font-bold tracking-tight text-slate-900 ${
          featured ? "text-2xl" : "text-lg"
        }`}
      >
        <Link
          to={`/blog/${blog.slug}`}
          className="line-clamp-2 decoration-indigo-300 decoration-2 underline-offset-4 group-hover:underline"
        >
          {blog.title}
        </Link>
      </h3>

      <p
        className={`mt-2 text-sm leading-6 text-slate-600 ${
          featured ? "line-clamp-3" : "line-clamp-2"
        }`}
      >
        {blog.description}
      </p>

      <div className="mt-auto flex items-center gap-2.5 pt-5">
        <Avatar
          name={blog.author.username}
          src={blog.author.avatar}
          size="sm"
        />
        <div className="min-w-0 text-xs text-slate-500">
          <Link
            to={`/profile/${blog.author.username}`}
            className="font-semibold text-slate-700 hover:text-indigo-600"
          >
            {blog.author.username}
          </Link>
          <div className="flex items-center gap-1.5">
            <time dateTime={blog.createdAt}>{formatDate(blog.createdAt)}</time>
            <span aria-hidden="true">·</span>
            <span>{blog.readTime} min read</span>
          </div>
        </div>
      </div>
    </article>
  );
}
