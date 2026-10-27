import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BlogCard from "../components/BlogCard";
import Avatar from "../components/Avatar";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Blog, ProfileResult } from "../types";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setLoading(true);

    api
      .profile(username)
      .then((result) => {
        if (!cancelled) setProfile(result);
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
  }, [username]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900">
          Profile not found
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {error ?? "This author does not exist."}
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

  const isOwner = user?.username === profile.user.username;
  const blogs: Blog[] = profile.blogs;
  const totalRead = blogs.reduce((sum, blog) => sum + blog.readTime, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="h-24 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500" />
        <div className="flex flex-col gap-5 px-6 pt-0 pb-6 sm:flex-row sm:items-end sm:px-8">
          <div className="-mt-10 rounded-full ring-4 ring-white">
            <Avatar
              name={profile.user.username}
              src={profile.user.avatar}
              size="lg"
            />
          </div>

          <div className="flex-1 sm:pb-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {profile.user.username}
              {isOwner && (
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 align-middle text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  you
                </span>
              )}
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              {profile.user.bio || "This author has not written a bio yet."}
            </p>
          </div>

          <div className="flex items-center gap-5 sm:pb-1">
            <div className="text-center">
              <p className="text-xl font-extrabold text-slate-900">
                {blogs.length}
              </p>
              <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                Articles
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl font-extrabold text-slate-900">
                {totalRead}
              </p>
              <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                Min read
              </p>
            </div>
            {isOwner && (
              <Link
                to="/write"
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
              >
                Write
              </Link>
            )}
          </div>
        </div>
      </section>

      <h2 className="mt-10 mb-4 text-lg font-bold text-slate-900">
        {isOwner ? "Your articles" : `Articles by ${profile.user.username}`}
      </h2>

      {blogs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-base font-semibold text-slate-800">
            No articles published yet
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            {isOwner
              ? "Your published articles will show up here."
              : "This author has not published anything so far."}
          </p>
          {isOwner && (
            <Link
              to="/write"
              className="mt-5 inline-block rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Write your first article
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {blogs.map((blog) => (
            <BlogCard key={blog._id} blog={blog} />
          ))}
        </div>
      )}
    </div>
  );
}
