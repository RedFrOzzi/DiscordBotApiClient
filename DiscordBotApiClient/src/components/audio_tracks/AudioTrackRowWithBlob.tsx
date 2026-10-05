import { Box, Skeleton, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { apiFetchBlob } from "../../api/client";
import type { AudioTrackDto } from "../../api/audioTracksApi";
import { AudioTrackRow } from "./AudioTrackRow";
import type { DiscordGuild } from "../../api/discordApi";
import { getCachedBlobUrl } from "../../api/blobUrlCache";

type Props = {
  track: AudioTrackDto;
  guilds?: DiscordGuild[];
  onDelete?: () => void;
  onRename?: () => void;
  onShare?: (targetGuildId: string) => void;
};

export function AudioTrackRowWithBlob({
  track,
  guilds,
  onDelete,
  onRename,
  onShare,
}: Props) {
  const {
    data: blob,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["audio-blob", track.key],
    queryFn: () => apiFetchBlob(track.downloadUrl!),
    enabled: !!track.downloadUrl,
    staleTime: Infinity,
    gcTime: 5 * 60_000,
  });

  const url = blob ? getCachedBlobUrl(blob) : null;

  if (!track.downloadUrl) {
    return <TrackRowShell>{track.title ?? "—"} — нет ссылки</TrackRowShell>;
  }

  if (isLoading) {
    return (
      <TrackRowShell>
        <Skeleton
          variant="text"
          width={140}
          sx={{ bgcolor: "rgba(255, 255, 255, 0.14)" }}
        />
      </TrackRowShell>
    );
  }

  if (isError || !url) {
    return (
      <TrackRowShell>
        {track.title ?? "—"} - ошибка загрузки звука
      </TrackRowShell>
    );
  }

  return (
    <AudioTrackRow
      title={track.title ?? "—"}
      url={url}
      guilds={guilds}
      currentGuildId={track.guildId}
      onDelete={onDelete}
      onRename={onRename}
      onShare={onShare}
    />
  );
}

function TrackRowShell({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        px: 1.5,
        py: 1.3,
        borderRadius: 1,
        border: "1px solid",
        borderColor: (t) => `${t.col.border_light}`,
        bgcolor: (t) => `${t.col.bg_500}`,
        color: (t) => t.col.text,
        fontSize: 13,
      }}
    >
      <Typography variant="body2" color="text.secondary" noWrap>
        {children}
      </Typography>
    </Box>
  );
}
