import { apiFetch } from "./client";

export type DiscordGuild = {
  id: string | null;
  name: string | null;
  ownerId: string | null;
  userIds: string[] | null;
  channelIds: string[] | null;
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

export const discordApi = {
  getGuilds: () => apiFetch<DiscordGuild[]>("/guilds/all-guilds"),
  getUsers: () => apiFetch<DiscordUser[]>("/guild-users/users-from-db"),
  getChannels: () => apiFetch<DiscordChannel[]>("/channels/db-channels"),
  createModerator: (dto: AddModeratorDto) =>
    apiFetch<void>("/users/create-moderator", {
      method: "POST",
      body: JSON.stringify(dto),
    }),
};
