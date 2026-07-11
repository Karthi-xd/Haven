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

/** A quick, media-first burst that lives for a short window — the "story" layer of Haven. */
export interface Flash {
  id: string;
  author: Profile;
  media_url: string;
  caption: string;
  posted_at: string;
  expires_at: string | null;
  seen_count: number;
  spark_count: number;
}

/** A saved, permanent piece a user chooses to keep forever in their Space. */
export interface Vault {
  id: string;
  author: Profile;
  title: string;
  body: string;
  cover_url: string | null;
  saved_at: string;
  buzz_count: number;
}

export type ReactableKind = "blurt";

/** Lightweight positive reaction (was "like/upvote"). */
export interface Buzz {
  id: string;
  user_id: string;
  target_kind: ReactableKind;
  target_id: string;
  created_at: string;
}

/** Lightweight negative reaction. */
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

/** A reply/comment on a Blurt. */
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
  id: string;
  media_url: string;
  posted_at: string;
  alive: boolean; // true = still pulsing, false = frozen in place
  buzz_count: number;
  spark_count: number;
}