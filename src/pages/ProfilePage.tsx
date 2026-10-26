import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "react-router-dom";

const ProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const router = useRouter();

  // If viewing own profile
  const isOwnProfile = user?.username === username;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (isOwnProfile && user) {
          setProfileUser(user);
          // Fetch user's blogs
          const response = await fetch(`/api/users/${user.id}/blogs`);
          const data = await response.json();
          setBlogs(data.blogs);
        } else {
          // Fetch public profile
          const response = await fetch(`/api/users/${username}`);
          const data = await response.json();
          
          if (!data.user) {
            setError("Profile not found");
            navigate("/");
            return;
          }
          
          setProfileUser(data.user);
          setBlogs(data.blogs);
        }
        setLoading(false);
      } catch (error: any) {
        setError(error.message || "Failed to fetch profile");
        navigate("/");
      }
    };

    fetchProfile();
  }, [username, user, isOwnProfile]);

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
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Profile Not Found</h2>
        <p className="text-gray-600">{error}</p>
        <button onClick={() => navigate("/")} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Go Home
        </button>
      </div>
    );
  }

  if (!profileUser) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {isOwnProfile ? "My Profile" : `${profileUser.username}'s Profile`}
      </h2>

      {isOwnProfile ? (
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Bio
          </label>
          <p className="text-gray-600 whitespace-pre-wrap">{profileUser.bio || "No bio added"}</p>
        </div>
      ) : (
        <div className="mb-6">
          <p className="text-gray-600 whitespace-pre-wrap">{profileUser.bio || "No bio added"}</p>
        </div>
      )}

      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-3">
          {isOwnProfile ? "My Blogs" : `${profileUser.username}'s Blogs`}
        </h3>

        {blogs.length === 0 ? (
          <p className="text-gray-500">No blogs found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blogs.map((blog) => (
              <div
                key={blog._id}
                className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h4 className="text-lg font-medium text-gray-800 line-clamp-2">
                  {blog.title}
                </h4>
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                  {blog.description}
                </p>
                <div className="mt-3 text-xs text-gray-400">
                  {new Date(blog.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;