import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BlogCard from "../components/BlogCard";
import { useSearchParams } from "react-router-dom";

const HomePage = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const params = useParams();

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const url = new URL("/api/blogs", window.location.origin);
        
        if (tagFilter) {
          url.searchParams.set("tag", tagFilter);
        }
        if (searchQuery) {
          url.searchParams.set("search", searchQuery);
        }
        url.searchParams.set("page", "1");
        url.searchParams.set("limit", "10");

        const response = await fetch(url);
        const data = await response.json();
        setBlogs(data.blogs);
        setError(null);
      } catch (error: any) {
        setError(error.message || "Failed to fetch blogs");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [tagFilter, searchQuery]);

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagFilter(e.target.value);
    setSearchQuery("");
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setTagFilter(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">
              Developer Blog
            </h1>
          </div>
          
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-gray-700 text-sm">
                  Welcome, {user.username}
                </span>
              </div>
              <button
                onClick={() => navigate("/create")}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                Write New Blog
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/register")}
                className="ml-3 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 text-sm font-medium"
              >
                Register
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {/* Tags Filter Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Explore by Technology</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              onClick={() => setTagFilter(null)}
              className={tagFilter === null 
                ? "bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
                : "bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm"}
            >
              All
            </button>
            <button
              onClick={() => setTagFilter("javascript")}
              className={tagFilter === "javascript"
                ? "bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
                : "bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm"}
            >
              JavaScript
            </button>
            <button
              onClick={() => setTagFilter("typescript")}
              className={tagFilter === "typescript"
                ? "bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
                : "bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm"}
            >
              TypeScript
            </button>
            <button
              onClick={() => setTagFilter("react")}
              className={tagFilter === "react"
                ? "bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
                : "bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm"}
            >
              React
            </button>
            <button
              onClick={() => setTagFilter("nodejs")}
              className={tagFilter === "nodejs"
                ? "bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
                : "bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm"}
            >
              Node.js
            </button>
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-6">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Blogs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-2 py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="col-span-2 py-8 text-center text-gray-500">
              <p>No blogs found matching your criteria.</p>
            </div>
          ) : (
            blogs.map((blog) => (
              <BlogCard
                key={blog._id}
                blog={blog}
                user={user}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default HomePage;