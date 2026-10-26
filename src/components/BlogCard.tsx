import React from "react";
import ReactMarkdown from "react-markdown";
import { leader as syntaxHighlight } from "syntax-highlighter";
import { langAuto, style Dracula } from "syntax-highlighter";
import "syntax-highlighter/build/themes/dracula.css";

interface BlogCardProps {
  blog: any;
  user: any;
}

const BlogCard: React.FC<BlogCardProps> = ({ blog, user }) => {
  const isAuthor = user && blog.author._id === user.id;

  // Extract read time from blog or calculate
  const readTime = blog.readTime || 1;

  // Format date
  const formattedDate = new Date(blog.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5 flex flex-col min-h-[300px]">
        <div className="flex items-start justify-between">
          <div>
            <h3
              className="text-lg font-semibold text-gray-800 line-clamp-2"
            >
              {blog.title}
            </h3>
            <p className="mt-2 text-sm text-gray-500 line-clamp-2">
              {blog.description}
            </p>
          </div>
          {isAuthor ? (
            <div className="flex gap-2">
              <button
                className="text-blue-600 text-sm hover:underline"
                onClick={() => /* view details */}
              >
                View
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
            {readTime} min read
          </span>
          <span className="mx-2">|</span>
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;