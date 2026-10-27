export interface User {
  id: string;
  username: string;
  email?: string;
  bio?: string;
  avatar?: string;
}

export interface Author {
  _id: string;
  username: string;
  bio?: string;
  avatar?: string;
}

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  description: string;
  markdown: string;
  coverImage?: string;
  tags: string[];
  author: Author;
  readTime: number;
  createdAt: string;
}

export interface BlogList {
  blogs: Blog[];
  total: number;
  page: number;
  totalPages: number;
}

export interface Tag {
  name: string;
  slug: string;
}

export interface AuthResult {
  token: string;
  user: User;
}

export interface ProfileResult {
  user: Author;
  blogs: Blog[];
}

export interface BlogInput {
  title: string;
  description: string;
  markdown: string;
  tags: string[];
  coverImage?: string;
}
