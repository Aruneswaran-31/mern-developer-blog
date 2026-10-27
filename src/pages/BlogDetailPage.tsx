import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import MarkdownView from "../components/MarkdownView";
import Avatar from "../components/Avatar";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import type { Blog } from "../types";

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);

    api
      .getBlog(slug)
      .then((result) => {
        if (!cancelled) setBlog(result);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900">
          Article not found
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {error ?? "This article may have been removed."}
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Back to the feed
        </Link>
      </div>
    );
  }

  const isAuthor = user?.username === blog.author.username;

  const handleDelete = async () => {
    if (!user) return;
    if (!window.confirm("Delete this article permanently?")) return;

    setDeleting(true);
    try {
      await api.deleteBlog(blog.slug, user);
      navigate("/", { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setDeleting(false);
    }
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
      >
        ← All articles
      </Link>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {blog.tags.map((tag) => (
          <Link
            key={tag}
            to={`/?tag=${encodeURIComponent(tag)}`}
            className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-indigo-600 uppercase hover:bg-indigo-100"
          >
            #{tag}
          </Link>
        ))}
      </div>

      <h1 className="text-3xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        {blog.title}
      </h1>

      <p className="mt-3 text-base leading-7 text-slate-600">
        {blog.description}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-slate-200 py-4">
        <div className="flex items-center gap-3">
          <Avatar
            name={blog.author.username}
            src={blog.author.avatar}
            size="md"
          />
          <div className="text-sm">
            <Link
              to={`/profile/${blog.author.username}`}
              className="font-semibold text-slate-900 hover:text-indigo-600"
            >
              {blog.author.username}
            </Link>
            <p className="text-xs text-slate-500">
              {formatDate(blog.createdAt)} · {blog.readTime} min read
            </p>
          </div>
        </div>

        {isAuthor && (
          <div className="flex items-center gap-2">
            <Link
              to={`/edit/${blog.slug}`}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        )}
      </div>

      <div className="mt-8">
        <MarkdownView content={blog.markdown} />
      </div>

      {blog.author.bio && (
        <div className="mt-12 flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <Avatar
            name={blog.author.username}
            src={blog.author.avatar}
            size="lg"
          />
          <div>
            <p className="text-sm font-bold text-slate-900">
              Written by{" "}
              <Link
                to={`/profile/${blog.author.username}`}
                className="text-indigo-600 hover:underline"
              >
                {blog.author.username}
              </Link>
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {blog.author.bio}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}
