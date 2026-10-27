import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, mode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError((err as Error).message || "Could not sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center">
      <div className="hidden lg:block">
        <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-slate-900">
          Welcome back to <span className="text-indigo-600">DevLog</span>
        </h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
          Sign in to publish new articles, edit your work and keep your
          developer profile up to date.
        </p>
        <ul className="mt-8 space-y-3 text-sm text-slate-600">
          {[
            "Markdown editor with live preview",
            "Syntax-highlighted code snippets",
            "Tag-based discovery and search",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2.5">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign in
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Use your email and password to continue.
        </p>

        {mode === "demo" && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
            <p className="font-semibold">Demo mode</p>
            <p className="mt-1">
              The API is offline, so accounts live in this browser only. You can
              sign up with any email on the register page, or use the sample
              account:{" "}
              <button
                type="button"
                onClick={() => {
                  setEmail("arun@devlog.dev");
                  setPassword("password123");
                }}
                className="font-mono font-semibold underline"
              >
                arun@devlog.dev
              </button>{" "}
              / <span className="font-mono font-semibold">password123</span>
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          New here?{" "}
          <Link
            to="/register"
            className="font-semibold text-indigo-600 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
