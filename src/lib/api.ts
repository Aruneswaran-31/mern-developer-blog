import axios, { type AxiosError } from "axios";
import { demo, demoSessionUser, demoSetSession } from "./demo";
import type {
  AuthResult,
  Blog,
  BlogInput,
  BlogList,
  ProfileResult,
  Tag,
  User,
} from "../types";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
const TOKEN_KEY = "devlog.token";

export type ApiMode = "live" | "demo";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

let modePromise: Promise<ApiMode> | null = null;

/**
 * Decide once whether the Express API is reachable. The UI behaves the same
 * either way; only the storage backing it changes.
 */
export function apiMode(): Promise<ApiMode> {
  if (!modePromise) {
    modePromise = axios
      .get(`${API_BASE}/api/health`, { timeout: 1500 })
      .then((res) => (res.data?.ok ? "live" : "demo"))
      .catch(() => "demo" as ApiMode);
  }
  return modePromise;
}

function authHeaders(): Record<string, string> {
  const token = tokenStore.get();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function messageFrom(error: unknown, fallback: string): string {
  const err = error as AxiosError<{ message?: string }>;
  return err?.response?.data?.message ?? err?.message ?? fallback;
}

/** Live API mode is no longer reachable — degrade permanently to demo. */
function degrade() {
  modePromise = Promise.resolve("demo");
}

export const api = {
  async listBlogs(params: {
    tag?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<BlogList> {
    const mode = await apiMode();
    if (mode === "demo") {
      return demo.listBlogs(params);
    }

    try {
      const { data } = await axios.get<BlogList>(`${API_BASE}/api/blogs`, {
        params,
      });
      return data;
    } catch (error) {
      degrade();
      return demo.listBlogs(params);
    }
  },

  async listTags(): Promise<Tag[]> {
    const mode = await apiMode();
    if (mode === "demo") return demo.listTags();

    try {
      const { data } = await axios.get<Tag[]>(`${API_BASE}/api/tags`);
      return data;
    } catch {
      degrade();
      return demo.listTags();
    }
  },

  async getBlog(slug: string): Promise<Blog> {
    const mode = await apiMode();
    if (mode === "demo") return demo.getBlog(slug);

    try {
      const { data } = await axios.get<Blog>(`${API_BASE}/api/blogs/${slug}`);
      return data;
    } catch (error) {
      degrade();
      return demo.getBlog(slug);
    }
  },

  async createBlog(input: BlogInput, user: User): Promise<Blog> {
    const mode = await apiMode();
    if (mode === "demo") return demo.createBlog(input, user);

    try {
      const { data } = await axios.post<{ blog: Blog }>(
        `${API_BASE}/api/blogs`,
        input,
        { headers: authHeaders() }
      );
      return data.blog;
    } catch (error) {
      throw new Error(messageFrom(error, "Could not publish the article"));
    }
  },

  async updateBlog(slug: string, input: BlogInput, user: User): Promise<Blog> {
    const mode = await apiMode();
    if (mode === "demo") return demo.updateBlog(slug, input, user);

    try {
      const { data } = await axios.put<{ blog: Blog }>(
        `${API_BASE}/api/blogs/${slug}`,
        input,
        { headers: authHeaders() }
      );
      return data.blog;
    } catch (error) {
      throw new Error(messageFrom(error, "Could not update the article"));
    }
  },

  async deleteBlog(slug: string, user: User): Promise<void> {
    const mode = await apiMode();
    if (mode === "demo") {
      demo.deleteBlog(slug, user);
      return;
    }

    try {
      await axios.delete(`${API_BASE}/api/blogs/${slug}`, {
        headers: authHeaders(),
      });
    } catch (error) {
      throw new Error(messageFrom(error, "Could not delete the article"));
    }
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const mode = await apiMode();
    if (mode === "demo") {
      const result = demo.login(email, password);
      demoSetSession(result.user);
      return result;
    }

    try {
      const { data } = await axios.post<AuthResult>(
        `${API_BASE}/api/users/login`,
        { email, password }
      );
      return data;
    } catch (error) {
      // The API was reachable during the probe but failed to answer: treat a
      // network-level failure as demo mode, a real 4xx as a credential error.
      const err = error as AxiosError;
      if (!err.response) {
        degrade();
        const result = demo.login(email, password);
        demoSetSession(result.user);
        return result;
      }
      throw new Error(messageFrom(error, "Invalid email or password"));
    }
  },

  async register(
    username: string,
    email: string,
    password: string
  ): Promise<AuthResult> {
    const mode = await apiMode();
    if (mode === "demo") {
      const result = demo.register(username, email, password);
      demoSetSession(result.user);
      return result;
    }

    try {
      const { data } = await axios.post<AuthResult>(
        `${API_BASE}/api/users/register`,
        { username, email, password }
      );
      return data;
    } catch (error) {
      const err = error as AxiosError;
      if (!err.response) {
        degrade();
        const result = demo.register(username, email, password);
        demoSetSession(result.user);
        return result;
      }
      throw new Error(messageFrom(error, "Could not create the account"));
    }
  },

  async me(): Promise<User | null> {
    const mode = await apiMode();

    if (mode === "demo") {
      return demoSessionUser();
    }

    const token = tokenStore.get();
    if (!token) return null;

    try {
      const { data } = await axios.get<User>(`${API_BASE}/api/users/me`, {
        headers: authHeaders(),
      });
      return data;
    } catch {
      return demoSessionUser();
    }
  },

  async profile(username: string): Promise<ProfileResult> {
    const mode = await apiMode();
    if (mode === "demo") return demo.profile(username);

    try {
      const { data } = await axios.get<ProfileResult>(
        `${API_BASE}/api/users/${username}`
      );
      return data;
    } catch (error) {
      const err = error as AxiosError;
      if (!err.response) {
        degrade();
        return demo.profile(username);
      }
      throw new Error(messageFrom(error, "Profile not found"));
    }
  },
};
