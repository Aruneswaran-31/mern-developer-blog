import type {
  AuthResult,
  Author,
  Blog,
  BlogInput,
  BlogList,
  ProfileResult,
  Tag,
  User,
} from "../types";

/**
 * Local fallback data store.
 *
 * The app talks to the Express/MongoDB API whenever it is reachable. When the
 * API is not running (for example a static preview of the UI), the same
 * operations are served from this `localStorage`-backed store so the whole
 * experience — sign in, write, publish, filter — stays functional.
 */

const DB_KEY = "devlog.demo.db.v1";
const SESSION_KEY = "devlog.demo.session.v1";
const DAY = 86_400_000;

interface DemoUser {
  id: string;
  username: string;
  email: string;
  password: string;
  bio: string;
  avatar: string;
}

interface DemoDB {
  users: DemoUser[];
  blogs: Blog[];
}

const authors: Record<string, Author> = {
  arun: {
    _id: "u_arun",
    username: "arun",
    bio: "Full-stack developer. I write about JavaScript internals, Node.js and building products that ship.",
    avatar: "",
  },
  maya: {
    _id: "u_maya",
    username: "maya",
    bio: "TypeScript enthusiast and frontend engineer. Currently obsessed with type-safe API design.",
    avatar: "",
  },
};

function seed(): DemoDB {
  const now = Date.now();

  const blogs: Blog[] = [
    {
      _id: "b_event_loop",
      title: "Understanding the JavaScript Event Loop",
      slug: "understanding-the-javascript-event-loop",
      description:
        "A practical walk through the call stack, microtasks and macrotasks, and why the ordering of your callbacks matters.",
      tags: ["javascript", "nodejs"],
      author: authors.arun,
      readTime: 6,
      createdAt: new Date(now - 6 * DAY).toISOString(),
      markdown: `Every JavaScript developer has, at some point, been surprised by the order in which their code runs. The reason lives in the **event loop**.

## The call stack

JavaScript runs your code on a single thread. Function calls are pushed onto a stack and popped when they return.

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("world"));
\`\`\`

Stack frames are synchronous. Anything that "waits" cannot live on the stack.

## Microtasks vs. macrotasks

Promises schedule **microtasks**. Timers schedule **macrotasks**.

\`\`\`javascript
console.log("1");

setTimeout(() => console.log("2"), 0);

Promise.resolve().then(() => console.log("3"));

console.log("4");

// 1, 4, 3, 2
\`\`\`

> Microtasks are drained completely before the next macrotask runs. That is why \`3\` beats the zero-delay timer.

## Why it matters in production

- A long synchronous loop blocks *every* callback, including HTTP handlers.
- Awaiting inside a loop serialises work you probably wanted in parallel.
- An unhandled rejected promise skips your error boundaries entirely.

\`\`\`javascript
// Serial: one request at a time
for (const id of ids) {
  results.push(await fetchUser(id));
}

// Concurrent: much faster
const results = await Promise.all(ids.map(fetchUser));
\`\`\`

Understanding the loop turns "it works on my machine" into predictable behaviour.`,
    },
    {
      _id: "b_typed_api",
      title: "Build a Type-Safe API Layer with React and TypeScript",
      slug: "build-a-type-safe-api-layer-with-react-and-typescript",
      description:
        "Stop sprinkling `any` through your fetch calls. A small typed client keeps responses honest and refactors safe.",
      tags: ["typescript", "react"],
      author: authors.maya,
      readTime: 5,
      createdAt: new Date(now - 4 * DAY).toISOString(),
      markdown: `Most React codebases lose type safety exactly where it matters: at the network boundary.

## Start with the response shapes

\`\`\`typescript
interface Blog {
  _id: string;
  title: string;
  slug: string;
  tags: string[];
  readTime: number;
}

interface BlogList {
  blogs: Blog[];
  total: number;
  page: number;
  totalPages: number;
}
\`\`\`

## One request helper

\`\`\`typescript
async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? \`Request failed: \${res.status}\`);
  }

  return (await res.json()) as T;
}
\`\`\`

Every call site now gets an inferred result type, and a renamed field becomes a compile error instead of a blank screen.

## Typing hooks

\`\`\`typescript
function useBlogs(tag?: string) {
  const [data, setData] = useState<BlogList | null>(null);

  useEffect(() => {
    request<BlogList>(\`/api/blogs?tag=\${tag ?? ""}\`)
      .then(setData)
      .catch(console.error);
  }, [tag]);

  return data;
}
\`\`\`

> The real win is not autocomplete — it is that the compiler tells you where a change propagates.

## Keep runtime validation for the edges you do not own

Types are erased. For third-party payloads, validate with something like Zod before trusting the result.`,
    },
    {
      _id: "b_jwt",
      title: "JWT Authentication in Express, Explained Simply",
      slug: "jwt-authentication-in-express-explained-simply",
      description:
        "Hashing passwords with bcrypt, issuing tokens, and protecting routes without a session store.",
      tags: ["nodejs", "express", "jwt"],
      author: authors.arun,
      readTime: 7,
      createdAt: new Date(now - 2 * DAY).toISOString(),
      markdown: `JWTs let a stateless API decide who is calling it. Here is the whole flow in one place.

## 1. Hash the password

Never store plaintext. bcrypt salts and slows hashing for you.

\`\`\`javascript
const salt = await bcrypt.genSalt(10);
user.password = await bcrypt.hash(user.password, salt);
\`\`\`

## 2. Issue a token on login

\`\`\`javascript
const token = jwt.sign(
  { userId: user._id, username: user.username },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);
\`\`\`

The payload is **signed**, not encrypted. Never put secrets in it.

## 3. Protect routes with middleware

\`\`\`javascript
export function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
\`\`\`

## 4. Authorise, don't just authenticate

Knowing *who* the caller is does not mean they may touch this record.

\`\`\`javascript
if (blog.author.toString() !== req.user.userId) {
  return res.status(403).json({ message: "Not your post" });
}
\`\`\`

| Status | Meaning |
| --- | --- |
| 401 | Not authenticated |
| 403 | Authenticated, not allowed |
| 404 | Resource missing |

> Keep \`JWT_SECRET\` in the environment. Rotating it invalidates every session at once — useful, and dangerous.`,
    },
    {
      _id: "b_mongo",
      title: "MongoDB Schema Design Patterns That Scale",
      slug: "mongodb-schema-design-patterns-that-scale",
      description:
        "Embed, reference, or denormalise? Three rules of thumb that keep Mongoose models fast as data grows.",
      tags: ["mongodb", "nodejs"],
      author: authors.maya,
      readTime: 4,
      createdAt: new Date(now - 1 * DAY).toISOString(),
      markdown: `MongoDB gives you freedom, and freedom is how you end up with an unqueryable `+ "`Any`" + ` type.

## Rule 1: embed what you always read together

If a comment is never shown without its post, embed it. One document, one round trip.

\`\`\`javascript
const postSchema = new Schema({
  title: String,
  body: String,
  comments: [{ author: String, text: String, at: Date }],
});
\`\`\`

## Rule 2: reference anything unbounded

Arrays that grow forever hit the 16 MB document limit and bloat the working set. Reference instead.

\`\`\`javascript
const blogSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  tags: [String],
  author: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
\`\`\`

## Rule 3: index the fields you filter on

\`\`\`javascript
blogSchema.index({ tags: 1, createdAt: -1 });
\`\`\`

> A query without an index is a full collection scan. It is fine with 40 documents and fatal with 4 million.

## Denormalise deliberately

Store the author's username next to the post only when you have measured that the join is hot, and accept that you now own keeping the copy in sync.`,
    },
  ];

  return {
    users: [
      {
        id: "u_arun",
        username: "arun",
        email: "arun@devlog.dev",
        password: "password123",
        bio: authors.arun.bio,
        avatar: "",
      },
      {
        id: "u_maya",
        username: "maya",
        email: "maya@devlog.dev",
        password: "password123",
        bio: authors.maya.bio,
        avatar: "",
      },
    ],
    blogs,
  };
}

function load(): DemoDB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as DemoDB;
  } catch {
    /* corrupted store — reseed */
  }
  const db = seed();
  save(db);
  return db;
}

function save(db: DemoDB) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* storage full or unavailable */
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normaliseTags(tags: string[]): string[] {
  return [
    ...new Set(
      tags
        .map((tag) => tag.trim().toLowerCase().replace(/\s+/g, "-"))
        .filter(Boolean)
    ),
  ];
}

function readTimeOf(markdown: string): number {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function toAuthor(user: DemoUser): Author {
  return {
    _id: user.id,
    username: user.username,
    bio: user.bio,
    avatar: user.avatar,
  };
}

function toPublicUser(user: DemoUser): User {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatar: user.avatar,
  };
}

export function demoSessionUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function demoSetSession(user: User | null) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

export const demo = {
  listBlogs({
    tag,
    search,
    page = 1,
    limit = 9,
  }: {
    tag?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): BlogList {
    const db = load();
    let blogs = [...db.blogs].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
    );

    if (tag) {
      const needle = tag.toLowerCase();
      blogs = blogs.filter((b) => b.tags.includes(needle));
    }

    if (search) {
      const needle = search.toLowerCase();
      blogs = blogs.filter(
        (b) =>
          b.title.toLowerCase().includes(needle) ||
          b.description.toLowerCase().includes(needle) ||
          b.tags.some((t) => t.includes(needle))
      );
    }

    const total = blogs.length;
    const start = (page - 1) * limit;

    return {
      blogs: blogs.slice(start, start + limit),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  },

  getBlog(slug: string): Blog {
    const blog = load().blogs.find((b) => b.slug === slug);
    if (!blog) throw new Error("Blog not found");
    return blog;
  },

  createBlog(input: BlogInput, user: User): Blog {
    const db = load();
    const base = slugify(input.title);
    const slug = db.blogs.some((b) => b.slug === base)
      ? `${base}-${Date.now().toString(36)}`
      : base;

    const blog: Blog = {
      _id: `b_${Date.now().toString(36)}`,
      title: input.title,
      slug,
      description: input.description,
      markdown: input.markdown,
      coverImage: input.coverImage ?? "",
      tags: normaliseTags(input.tags),
      author: {
        _id: user.id,
        username: user.username,
        bio: user.bio ?? "",
        avatar: user.avatar ?? "",
      },
      readTime: readTimeOf(input.markdown),
      createdAt: new Date().toISOString(),
    };

    db.blogs.unshift(blog);
    save(db);
    return blog;
  },

  updateBlog(slug: string, input: BlogInput, user: User): Blog {
    const db = load();
    const blog = db.blogs.find((b) => b.slug === slug);
    if (!blog) throw new Error("Blog not found");
    if (blog.author._id !== user.id) throw new Error("Not authorized");

    blog.title = input.title;
    blog.description = input.description;
    blog.markdown = input.markdown;
    blog.tags = normaliseTags(input.tags);
    blog.readTime = readTimeOf(input.markdown);
    save(db);
    return blog;
  },

  deleteBlog(slug: string, user: User) {
    const db = load();
    const blog = db.blogs.find((b) => b.slug === slug);
    if (!blog) throw new Error("Blog not found");
    if (blog.author._id !== user.id) throw new Error("Not authorized");
    db.blogs = db.blogs.filter((b) => b.slug !== slug);
    save(db);
  },

  listTags(): Tag[] {
    const counts = new Map<string, number>();
    for (const blog of load().blogs) {
      for (const tag of blog.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([slug]) => ({
        slug,
        name: slug.charAt(0).toUpperCase() + slug.slice(1),
      }));
  },

  login(email: string, password: string): AuthResult {
    const db = load();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!user || user.password !== password) {
      throw new Error("Invalid email or password");
    }
    return { token: `demo.${user.id}`, user: toPublicUser(user) };
  },

  register(username: string, email: string, password: string): AuthResult {
    const db = load();
    const clean = username.trim();
    const mail = email.trim().toLowerCase();

    if (db.users.some((u) => u.email.toLowerCase() === mail)) {
      throw new Error("An account with this email already exists");
    }
    if (db.users.some((u) => u.username.toLowerCase() === clean.toLowerCase())) {
      throw new Error("That username is already taken");
    }

    const user: DemoUser = {
      id: `u_${Date.now().toString(36)}`,
      username: clean,
      email: mail,
      password,
      bio: "",
      avatar: "",
    };

    db.users.push(user);
    save(db);
    return { token: `demo.${user.id}`, user: toPublicUser(user) };
  },

  me(userId: string): User {
    const user = load().users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");
    return toPublicUser(user);
  },

  profile(username: string): ProfileResult {
    const db = load();
    const user = db.users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
    if (!user) throw new Error("Profile not found");

    const blogs = db.blogs
      .filter((b) => b.author.username.toLowerCase() === username.toLowerCase())
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    return { user: toAuthor(user), blogs };
  },
};
