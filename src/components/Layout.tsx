import React from "react";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-800">Developer Blog</h1>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-gray-700 text-sm">Welcome, <span className="font-medium">User</span></span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;