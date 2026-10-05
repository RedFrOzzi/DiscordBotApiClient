import { apiFetch } from "./client";

export type AudioTrackDto = {
  key: number;
  title: string | null;
  guildId: string | null;
  sizeInKb: number | null;
  createdAt: string | null;
  downloadUrl: string | null;
};

export type UpdateAudioPanelDto = {
  guildId: string;
  channelId: string;
};

export type UploadAudioTrackDto = {
  title: string;
  guildId: string;
  file: File;
};

export type RenameAudioTrackDto = {
  key: number;
  newTitle: string;
};

export type ShareAudioTrackDto = {
  key: number;
  guildId: string;
};

export type DeleteAudioTrackDto = {
  guildId: string;
  title: string;
};

export const audioTracksApi = {
  getByGuild: (guildId: string, bust?: number) =>
    apiFetch<AudioTrackDto[]>(
      `/audio-tracks/get-all?guildId=${encodeURIComponent(guildId)}` +
        (bust ? `&_=${bust}` : ""),
    ),

  updateAudioPanel: (dto: UpdateAudioPanelDto) =>
    apiFetch<void>("/audio-tracks/update-audio-panel", {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  rename: (dto: RenameAudioTrackDto) =>
    apiFetch<void>("/audio-tracks/rename", {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),

  share: (dto: ShareAudioTrackDto) =>
    apiFetch<void>("/audio-tracks/share", {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  delete: (dto: DeleteAudioTrackDto) =>
    apiFetch<void>("/audio-tracks/delete", {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  upload: (dto: UploadAudioTrackDto) => {
    const form = new FormData();
    form.append("Title", dto.title);
    form.append("GuildId", dto.guildId);
    form.append("File", dto.file);

    return apiFetch<void>("/audio-tracks/upload", {
      method: "POST",
      body: form,
    });
  },
};
