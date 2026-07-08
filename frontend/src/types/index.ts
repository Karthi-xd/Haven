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
export interface Flash {
  id: string;
  author: Profile;
  media_url: string;
  media_kind: "image" | "video";
  caption: string;
  followers_only: boolean; // buried setting — default false (public)
  posted_at: string;
  expires_at: string;
  fallen: boolean; // true once past expires_at
  buzz_count: number;
  spark_count: number;
  chime_count: number;
}

/** A short text post. Falls in 24h unless `lingering` is set. */
export interface Blurt {
  id: string;
  author: Profile;
  body: string;
  lingering: boolean; // "let it linger" -> becomes permanent
  posted_at: string;
  expires_at: string | null; // null once lingering flips true
  fallen: boolean;
  buzz_count: number;
  spark_count: number;
  chime_count: number;
}

/** A sealed, scheduled post. Hidden until unlocks_at, then behaves like a Flash. */
export interface Vault {
  id: string;
  author: Profile;
  media_url: string;
  media_kind: "image" | "video";
  caption: string;
  followers_only: boolean;
  sealed: boolean; // true until unlocks_at passes
  unlocks_at: string;
  unlocked_flash_id: string | null; // set once it opens into a live Flash
  created_at: string;
}

export type ReactableKind = "flash" | "blurt";

/** Lightweight positive reaction (was "like/upvote"). */
export interface Buzz {
  id: string;
  user_id: string;
  target_kind: ReactableKind;
  target_id: string;
  created_at: string;
}

/** Lightweight negative reaction (was "dislike/downvote"). Flashes wilt when this lands. */
export interface Strike {
  id: string;
  user_id: string;
  target_kind: ReactableKind;
  target_id: string;
  created_at: string;
}

/** Rare reaction — "this genuinely changed how I see things". Visually distinct from a Buzz. */
export interface Spark {
  id: string;
  user_id: string;
  target_kind: ReactableKind;
  target_id: string;
  created_at: string;
}

/** A reply/comment on a Flash or Blurt. */
export interface Chime {
  id: string;
  target_kind: ReactableKind;
  target_id: string;
  author: Profile;
  parent_id: string | null; // for threaded replies
  body: string;
  created_at: string;
}

/** Follow relationship — "Tending" someone's Space. */
export interface Tending {
  id: string;
  tender_id: string; // the follower
  tended_id: string; // the profile being followed
  created_at: string;
}

/** A pending message request into someone's Den. */
export interface Ping {
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

/** A single branch point in a user's Trail. */
export interface TrailNode {
  flash_id: string;
  media_url: string;
  posted_at: string;
  alive: boolean; // true = still pulsing, false = frozen in place
  buzz_count: number;
  spark_count: number;
}
