import { apiFetch } from "./client";
import type { EmbedPayload } from "./embedPayload";

export type DiscordGuild = {
  id: string | null;
  name: string | null;
  ownerId: string | null;
  userIds: string[] | null;
  channelIds: string[] | null;
  iconUrl: string | null;
};

export type VoiceState = {
  channelId: string;
  isMuted: boolean;
  isDeafened: boolean;
};

export type DiscordUser = {
  id: string;
  username: string;
  nickname: string | null;
  globalName: string | null;
  imageURL: string | null;
  guildIds: string[];
  voiceState: VoiceState | null;
  userResource: number;
};

export type DiscordChannel = {
  id: string;
  name: string | null;
  isTextChannel: boolean | null;
  guildId: string | null;
};

export type AddModeratorDto = {
  login: string;
  password: string;
  newModeratorLogin: string;
};

export type SendMessageDto = {
  guildId: string;
  channelId: string;
  content: string;
};

export const discordApi = {
  getGuilds: () => apiFetch<DiscordGuild[]>("/guilds/all-guilds"),
  getUsers: () => apiFetch<DiscordUser[]>("/guild-users/users-from-db"),
  getChannels: () => apiFetch<DiscordChannel[]>("/channels/db-channels"),
  createModerator: (dto: AddModeratorDto) =>
    apiFetch<void>("/users/create-moderator", {
      method: "POST",
      body: JSON.stringify(dto),
    }),
  updateGuildData: (guildId: string) =>
    apiFetch<void>(
      `/guilds/update-guild-data?guildId=${encodeURIComponent(guildId)}`,
      { method: "POST" },
    ),

  sendMessage: (channelId: string, message: string) =>
    apiFetch<void>(
      `/bot-messages/send-message?channelId=${encodeURIComponent(channelId)}`,
      {
        method: "POST",
        body: JSON.stringify(message),
      },
    ),
  sendVoiceMessage: (channelId: string, message: string) =>
    apiFetch<void>(
      `/bot-messages/send-voice-message?channelId=${encodeURIComponent(channelId)}`,
      {
        method: "POST",
        body: JSON.stringify(message),
      },
    ),
  sendEmbed: (channelId: string, embed: EmbedPayload) =>
    apiFetch<void>(
      `/bot-messages/send-embed?channelId=${encodeURIComponent(channelId)}`,
      { method: "POST", body: JSON.stringify(embed) },
    ),

  updateUsers: (guildId: string) =>
    apiFetch<void>(
      `/guild-users/update-users?guildId=${encodeURIComponent(guildId)}`,
      { method: "PATCH" },
    ),

  getUpdateProgress: () => apiFetch<number>("/guild-users/update-progress"),

  cancelUpdate: () =>
    apiFetch<void>("/guild-users/cancel-update-users", { method: "PATCH" }),

  updateServer: () =>
    apiFetch<void>("/webhooks/update-server", { method: "POST" }),
};
