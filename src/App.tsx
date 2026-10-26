import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "syntax-highlighter/build/css/syntax-highlighter-core.css";
import "syntax-highlighter/build/themes/dracula.css";

import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import CreateBlogPage from "./pages/CreateBlogPage";
import ProfilePage from "./pages/ProfilePage";
import BlogDetailPage from "./pages/BlogDetailPage";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/create" element={<Layout><CreateBlogPage /></Layout>} />
        <Route path="/profile/:username" element={<Layout><ProfilePage /></Layout>} />
        <Route path="/blog/:slug" element={<BlogDetailPage />} />
      </Routes>
    </Router>
  );
};

export default App;