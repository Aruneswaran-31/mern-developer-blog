import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ReactMarkdown from "react-markdown";
import { leader as syntaxHighlight } from "syntax-highlighter";
import { style Dracula } from "syntax-highlighter";
import "syntax-highlighter/build/themes/dracula.css";

interface SyntaxHighlighterProps {
  code: string;
  language: string;
}

const SyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({ code, language }) => {
  if (!code || !language) {
    return <pre className="bg-gray-800 p-4 rounded-md text-gray-300 overflow-x-auto"><code className="text-gray-300">{code}</code></pre>;
  }

  return (
    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
      <code className="text-gray-300">
        {syntaxHighlight(code, language, "plain-text")}
      </code>
    </pre>
  );
};

SyntaxHighlighter.displayName = "SyntaxHighlighter";

const BlogDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await fetch(`/api/blogs/${slug}`);
        const data = await response.json();
        
        if (!data.blog) {
          setError("Blog not found");
          navigate("/");
          return;
        }

        setBlog(data.blog);
        setLoading(false);
      } catch (error: any) {
        setError(error.message || "Failed to fetch blog");
        navigate("/");
      }
    };

    fetchBlog();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Blog Not Found</h2>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Go Home
        </button>
      </div>
    );
  }

  const isAuthor = user && blog.author._id === user.id;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{blog.title}</h1>
            <p className="mt-2 text-sm text-gray-500">
              {blog.description}
            </p>
          </div>
          {isAuthor ? (
            <div className="flex gap-2">
              <button
                className="text-blue-600 text-sm hover:underline"
                onClick={() => navigate(`/edit/${blog.slug}`)}
              >
                Edit
              </button>
              <button
                className="text-red-600 text-sm hover:underline"
                onClick={() => /* delete */}
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-2">
          {blog.tags?.map((tag: string) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs border border-gray-300 bg-gray-100 text-gray-700"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Metadata */}
        <div className="mt-4 flex items-center text-xs text-gray-500">
          <span>
            {blog.readTime || 1} min read
          </span>
          <span className="mx-2">|</span>
          <span>
            {new Date(blog.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      <div className="p-6 flex-1">
        <ReactMarkdown
          source={blog.markdown}
          components={{
            code([props]: any) {
              const { children, className, language } = props;
              if (!language) {
                return <code>{children}</code>;
              }
              return (
                <SyntaxHighlighter
                  code={children as string}
                  language={language}
                />
              );
            },
          }}
          className="prose lg:prose-xl max-w-none text-gray-800"
        />
      </div>
    </div>
  );
};

export default BlogDetailPage;