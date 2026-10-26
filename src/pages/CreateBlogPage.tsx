import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ReactMarkdown from "react-markdown";
import { leader as syntaxHighlight } from "syntax-highlighter";
import { langAuto, style Dracula } from "syntax-highlighter";
import "syntax-highlighter/build/themes/dracula.css";

const programmingLangs = [
  "javascript",
  "typescript",
  "python",
  "java",
  "go",
  "rust",
  "c",
  "c++",
  "css",
  "html",
  "bash",
  "sql",
];

const CreateBlogPage = () => {
  const { user } = useAuth();
  if (!user) {
    navigate("/login");
  }

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!title || !markdown) {
      setError("Title and content are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await fetch("/api/blogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          title,
          description,
          markdown,
          tags,
        }),
      });

      navigate("/");
    } catch (error: any) {
      setError(error.message || "Failed to create blog");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Write New Blog</h1>
          <button
            onClick={() => navigate("/")}
            className="text-gray-500 hover:text-blue-600 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-2xl mx-auto">
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}>
            <div className="mb-4">
              <label 
                htmlFor="title" 
                className="block text-gray-700 text-sm font-medium mb-2"
              >
                Title
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter blog title"
              />
            </div>

            <div className="mb-4">
              <label 
                htmlFor="description" 
                className="block text-gray-700 text-sm font-medium mb-2"
              >
                Description (brief overview)
              </label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of what this blog covers"
              />
            </div>

            <div className="mb-6">
              <label 
                htmlFor="tags" 
                className="block text-gray-700 text-sm font-medium mb-2"
              >
                Technology Tags (comma-separated)
              </label>
              <input
                id="tags"
                type="text"
                value={tags.join(", ")}
                onChange={(e) => setTags(e.target.value.split(",").map(t => t.trim()).filter(t => t))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus-border-transparent"
                placeholder="javascript, typescript, react, nodejs"
              />
              <p className="mt-1 text-xs text-gray-500">
                Separate tags with commas (e.g., javascript, typescript, react)
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Content (Markdown)
              </label>
              <textarea
                id="markdown"
                rows={10}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Write your blog content in Markdown format. Use ```language for code blocks..."
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              {loading ? "Publishing..." : "Publish Blog"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateBlogPage;