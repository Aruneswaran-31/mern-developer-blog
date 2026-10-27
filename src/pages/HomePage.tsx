import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import BlogCard from "../components/BlogCard";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Blog, Tag } from "../types";

export default function HomePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTag = searchParams.get("tag") ?? "";
  const query = searchParams.get("q") ?? "";

  const [searchInput, setSearchInput] = useState(query);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep the input in sync when the query parameter changes externally.
  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  // Debounce typing into the ?q= parameter.
  useEffect(() => {
    if (searchInput === query) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (searchInput.trim()) next.set("q", searchInput.trim());
      else next.delete("q");
      setSearchParams(next, { replace: true });
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, query, searchParams, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .listBlogs({ tag: activeTag || undefined, search: query || undefined })
      .then((result) => {
        if (cancelled) return;
        setBlogs(result.blogs);
        setTotal(result.total);
        setError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTag, query]);

  useEffect(() => {
    api.listTags().then(setTags).catch(() => setTags([]));
  }, [blogs.length]);

  const selectTag = (tag: string) => {
    const next = new URLSearchParams(searchParams);
    if (tag) next.set("tag", tag);
    else next.delete("tag");
    setSearchParams(next);
  };

  const isFiltered = Boolean(activeTag || query);
  const [featured, ...rest] = blogs;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Hero */}
      {!isFiltered && (
        <section className="mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-6 py-10 text-white shadow-xl shadow-indigo-200/60 sm:px-10 sm:py-14">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            {total} article{total === 1 ? "" : "s"} published
          </p>
          <h1 className="max-w-2xl text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
            A home for developers who write about what they build.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
            Publish Markdown articles with syntax-highlighted code, tag them by
            technology, and share them with the community.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to={user ? "/write" : "/register"}
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
            >
              {user ? "Write an article" : "Start writing"}
            </Link>
            <a
              href="#feed"
              className="rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Browse the feed
            </a>
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div id="feed">
          {/* Controls */}
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">
                {isFiltered ? "Search results" : "Latest articles"}
                <span className="ml-2 text-sm font-medium text-slate-400">
                  {loading ? "" : `${total} found`}
                </span>
              </h2>

              <div className="relative w-full sm:w-72">
                <svg
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search articles, tags…"
                  aria-label="Search articles"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-3 pl-9 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => selectTag("")}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    activeTag === ""
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  All topics
                </button>
                {tags.map((tag) => (
                  <button
                    key={tag.slug}
                    type="button"
                    onClick={() => selectTag(tag.slug)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      activeTag === tag.slug
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                    }`}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            )}

            {isFiltered && (
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className="self-start text-xs font-semibold text-indigo-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Feed */}
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {[0, 1, 2, 3].map((key) => (
                <div
                  key={key}
                  className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
              {error}
            </div>
          ) : blogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <p className="text-lg font-semibold text-slate-800">
                Nothing here yet
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                No articles match this search. Try another keyword or clear the
                filters.
              </p>
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Show all articles
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {!isFiltered && featured && (
                <div className="sm:col-span-2">
                  <BlogCard blog={featured} featured />
                </div>
              )}
              {(isFiltered ? blogs : rest).map((blog) => (
                <BlogCard key={blog._id} blog={blog} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-bold tracking-wide text-slate-900 uppercase">
              Trending tags
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.slice(0, 10).map((tag) => (
                <button
                  key={tag.slug}
                  type="button"
                  onClick={() => selectTag(tag.slug)}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600"
                >
                  #{tag.name}
                </button>
              ))}
              {tags.length === 0 && (
                <p className="text-xs text-slate-400">No tags yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-bold tracking-wide text-slate-900 uppercase">
              Write here
            </h3>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Share a tutorial, a debugging war story or the internals of
              something you just learned.
            </p>
            <Link
              to={user ? "/write" : "/register"}
              className="mt-4 block rounded-xl bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {user ? "New article" : "Create an account"}
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-xs leading-5 text-slate-500">
            Built with MongoDB, Express, React, Node.js, JWT and Markdown.
          </div>
        </aside>
      </div>
    </div>
  );
}
