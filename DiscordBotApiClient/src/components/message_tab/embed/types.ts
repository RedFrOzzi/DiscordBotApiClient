export type EmbedField = {
  name: string;
  value: string;
  inline: boolean;
};

export type EmbedState = {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: string | null; // ISO string
  color?: string; // hex "#06D6A0"
  footer?: { text?: string; iconUrl?: string };
  image?: { url?: string };
  thumbnail?: { url?: string };
  author?: { name?: string; url?: string; iconUrl?: string };
  fields?: EmbedField[];
};

export type EmbedPropertyKey =
  | "title"
  | "description"
  | "url"
  | "timestamp"
  | "color"
  | "footer"
  | "image"
  | "thumbnail"
  | "author"
  | "fields";
