import type { EmbedState } from "../components/message_tab/embed/types";

export type EmbedPayload = {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: { text?: string; icon_url?: string };
  image?: { url?: string };
  thumbnail?: { url?: string };
  author?: { name?: string; url?: string; icon_url?: string };
  fields?: { name: string; value: string; inline: boolean }[];
};

export function hasEmbedContent(embed: EmbedState): boolean {
  if (embed.title?.trim()) return true;
  if (embed.description?.trim()) return true;
  if (embed.url?.trim()) return true;
  if (embed.timestamp) return true;
  if (embed.footer?.text?.trim() || embed.footer?.iconUrl?.trim()) return true;
  if (embed.image?.url?.trim()) return true;
  if (embed.thumbnail?.url?.trim()) return true;
  if (
    embed.author?.name?.trim() ||
    embed.author?.url?.trim() ||
    embed.author?.iconUrl?.trim()
  )
    return true;
  if (embed.fields?.some((f) => f.name.trim() || f.value.trim())) return true;
  return false;
}

export function buildEmbedPayload(embed: EmbedState): EmbedPayload {
  const payload: EmbedPayload = {};

  if (embed.title?.trim()) payload.title = embed.title.trim();
  if (embed.description?.trim()) payload.description = embed.description.trim();
  if (embed.url?.trim()) payload.url = embed.url.trim();
  if (embed.timestamp) payload.timestamp = embed.timestamp;

  if (embed.color) {
    const int = parseInt(embed.color.replace(/^#/, ""), 16);
    if (!Number.isNaN(int)) payload.color = int;
  }

  if (
    embed.author &&
    (embed.author.name?.trim() ||
      embed.author.url?.trim() ||
      embed.author.iconUrl?.trim())
  ) {
    payload.author = {};
    if (embed.author.name?.trim())
      payload.author.name = embed.author.name.trim();
    if (embed.author.url?.trim()) payload.author.url = embed.author.url.trim();
    if (embed.author.iconUrl?.trim())
      payload.author.icon_url = embed.author.iconUrl.trim();
  }

  if (
    embed.footer &&
    (embed.footer.text?.trim() || embed.footer.iconUrl?.trim())
  ) {
    payload.footer = {};
    if (embed.footer.text?.trim())
      payload.footer.text = embed.footer.text.trim();
    if (embed.footer.iconUrl?.trim())
      payload.footer.icon_url = embed.footer.iconUrl.trim();
  }

  if (embed.image?.url?.trim()) payload.image = { url: embed.image.url.trim() };
  if (embed.thumbnail?.url?.trim())
    payload.thumbnail = { url: embed.thumbnail.url.trim() };

  if (embed.fields && embed.fields.length > 0) {
    const cleaned = embed.fields
      .filter((f) => f.name.trim() || f.value.trim())
      .map((f) => ({
        name: f.name.trim(),
        value: f.value.trim(),
        inline: f.inline,
      }));
    if (cleaned.length > 0) payload.fields = cleaned;
  }

  return payload;
}
