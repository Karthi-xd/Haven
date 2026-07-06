// ---------------------------------------------------------------------------
// Haven — core domain types
// ---------------------------------------------------------------------------

export interface Profile {
  id: string; // == auth.users.id
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  created_at: string;
}

/** A photo/video post. Public by default, falls after 24h. */
export interface Petal {
  id: string;
  author: Profile;
  media_url: string;
  media_kind: "image" | "video";
  caption: string;
  followers_only: boolean; // buried setting — default false (public)
  posted_at: string;
  expires_at: string;
  fallen: boolean; // true once past expires_at
  touch_count: number;
  rootbloom_count: number;
  sprout_count: number;
}

/** A short text post. Falls in 24h unless `lingering` is set. */
export interface Whisper {
  id: string;
  author: Profile;
  body: string;
  lingering: boolean; // "let it linger" -> becomes permanent
  posted_at: string;
  expires_at: string | null; // null once lingering flips true
  fallen: boolean;
  touch_count: number;
  rootbloom_count: number;
  sprout_count: number;
}

/** A sealed, scheduled post. Hidden until unlocks_at, then behaves like a Petal. */
export interface Bloom {
  id: string;
  author: Profile;
  media_url: string;
  media_kind: "image" | "video";
  caption: string;
  followers_only: boolean;
  sealed: boolean; // true until unlocks_at passes
  unlocks_at: string;
  unlocked_petal_id: string | null; // set once it opens into a live Petal
  created_at: string;
}

export type ReactableKind = "petal" | "whisper";

/** Lightweight positive reaction (was "like/upvote"). */
export interface Touch {
  id: string;
  user_id: string;
  target_kind: ReactableKind;
  target_id: string;
  created_at: string;
}

/** Lightweight negative reaction (was "dislike/downvote"). Petals wilt when this lands. */
export interface Wilt {
  id: string;
  user_id: string;
  target_kind: ReactableKind;
  target_id: string;
  created_at: string;
}

/** Rare reaction — "this genuinely changed how I see things". Visually distinct from a Touch. */
export interface Rootbloom {
  id: string;
  user_id: string;
  target_kind: ReactableKind;
  target_id: string;
  created_at: string;
}

/** A reply/comment on a Petal or Whisper. */
export interface Sprout {
  id: string;
  target_kind: ReactableKind;
  target_id: string;
  author: Profile;
  parent_id: string | null; // for threaded replies
  body: string;
  created_at: string;
}

/** Follow relationship — "Tending" someone's Garden. */
export interface Tending {
  id: string;
  tender_id: string; // the follower
  tended_id: string; // the profile being followed
  created_at: string;
}

/** A pending message request into someone's Garden Gate. */
export interface Knock {
  id: string;
  from_id: string;
  to_id: string;
  opening_message: string;
  status: "pending" | "approved" | "declined";
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_a: string;
  participant_b: string;
  created_at: string;
  last_message_at: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

/** A single branch point in a user's Petal Path / Bloomline. */
export interface PetalPathNode {
  petal_id: string;
  media_url: string;
  posted_at: string;
  alive: boolean; // true = still pulsing, false = frozen in place
  touch_count: number;
  rootbloom_count: number;
}
