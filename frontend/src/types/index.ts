export interface User {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  karma: number;
  created_at: string;
}

export interface Community {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_url: string;
  banner_url: string;
  created_by: string;
  member_count: number;
  created_at: string;
}

export interface Post {
  id: string;
  community: string;
  community_slug: string;
  author: User;
  kind: "text" | "link" | "image";
  title: string;
  body: string;
  url: string;
  score: number;
  comment_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post: string;
  author: User;
  parent: string | null;
  body: string;
  score: number;
  created_at: string;
  updated_at: string;
}
