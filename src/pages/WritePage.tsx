import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MarkdownView from "../components/MarkdownView";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const STARTER = `## Introduction

Explain what you are building and why it matters.

\`\`\`js
const greet = (name) => \`Hello, \${name}\`;
console.log(greet("developer"));
\`\`\`

## What we will cover

- The problem
- The approach
- The result
`;

export default function WritePage() {
  const { slug } = useParams<{ slug?: string }>();
  const isEditing = Boolean(slug);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [markdown, setMarkdown] = useState(STARTER);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");

  const [tab, setTab] = useState<"write" | "preview">("write");
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    api
      .getBlog(slug)
      .then((blog) => {
        if (cancelled) return;
        setTitle(blog.title);
        setDescription(blog.description);
        setMarkdown(blog.markdown);
        setTags(blog.tags);
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

  const addTag = (raw: string) => {
    const value = raw
      .trim()
      .toLowerCase()
      .replace(/^#/, "")
      .replace(/\s+/g, "-");
    if (!value) return;
    setTags((current) =>
      current.includes(value) || current.length >= 5 ? current : [...current, value]
    );
    setTagDraft("");
  };

  const stats = useMemo(() => {
    const words = markdown.split(/\s+/).filter(Boolean).length;
    return {
      words,
      minutes: Math.max(1, Math.ceil(words / 200)),
    };
  }, [markdown]);

  const canPublish =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    markdown.trim().length > 0 &&
    tags.length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setError(null);

    if (!canPublish) {
      setError("Add a title, a short description, at least one tag and some content.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        markdown,
        tags,
      };

      const blog = isEditing
        ? await api.updateBlog(slug!, payload, user)
        : await api.createBlog(payload, user);

      navigate(`/blog/${blog.slug}`, { replace: true });
    } catch (err) {
      setError((err as Error).message || "Could not save the article");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {isEditing ? "Edit article" : "New article"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Draft in Markdown — the preview renders exactly what readers see.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{stats.words} words</span>
          <span aria-hidden="true">·</span>
          <span>{stats.minutes} min read</span>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <label
            htmlFor="title"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Understanding the JavaScript event loop"
            maxLength={100}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-lg font-semibold outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />

          <label
            htmlFor="description"
            className="mt-4 mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Short description
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="One or two sentences shown in the feed."
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />

          <div className="mt-4">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Technology tags
              <span className="ml-2 font-normal text-slate-400">
                up to 5
              </span>
            </span>

            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() =>
                      setTags((current) =>
                        current.filter((item) => item !== tag)
                      )
                    }
                    className="text-indigo-400 transition hover:text-indigo-700"
                    aria-label={`Remove ${tag} tag`}
                  >
                    ×
                  </button>
                </span>
              ))}

              <input
                type="text"
                value={tagDraft}
                onChange={(event) => setTagDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === ",") {
                    event.preventDefault();
                    addTag(tagDraft);
                  }
                  if (event.key === "Backspace" && !tagDraft && tags.length) {
                    setTags((current) => current.slice(0, -1));
                  }
                }}
                onBlur={() => addTag(tagDraft)}
                placeholder={tags.length ? "Add another…" : "javascript, react…"}
                className="min-w-[10rem] flex-1 bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Press Enter or comma to add a tag.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-2 py-2">
            <div className="flex gap-1">
              {(["write", "preview"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTab(value)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold capitalize transition ${
                    tab === value
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <span className="pr-2 font-mono text-[11px] text-slate-400">
              Markdown
            </span>
          </div>

          {tab === "write" ? (
            <textarea
              value={markdown}
              onChange={(event) => setMarkdown(event.target.value)}
              spellCheck={false}
              placeholder="Write your article in Markdown…"
              className="h-[28rem] w-full resize-y bg-white px-5 py-4 font-mono text-[13.5px] leading-6 text-slate-800 outline-none"
            />
          ) : (
            <div className="h-[28rem] overflow-y-auto px-5 py-4">
              {markdown.trim() ? (
                <MarkdownView content={markdown} />
              ) : (
                <p className="text-sm text-slate-400">Nothing to preview yet.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Saving…"
              : isEditing
                ? "Save changes"
                : "Publish article"}
          </button>
        </div>
      </form>
    </div>
  );
}
