import { useEffect, useRef, useState } from "react";
import {
  Box,
  IconButton,
  Typography,
  Tooltip,
  Menu,
  MenuItem,
  ListItemText,
  Avatar,
  CircularProgress,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import StopIcon from "@mui/icons-material/Stop";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineRounded";
import ShareIcon from "@mui/icons-material/Share";
import EditIcon from "@mui/icons-material/Edit";
import type { DiscordGuild } from "../../api/discordApi";
import DownloadIcon from "@mui/icons-material/Download";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import { useMutation } from "@tanstack/react-query";
import { audioTracksApi } from "../../api/audioTracksApi";
import { ApiError } from "../../api/ApiError";

type Props = {
  title: string;
  url: string;
  blob?: Blob;
  trackKey: number;
  guilds?: DiscordGuild[];
  currentGuildId?: string | null;
  onEnded?: () => void;
  onError?: (err: string) => void;
  onDelete?: () => void;
  onRename?: () => void;
  onShare?: (targetGuildId: string) => void;
  onDiscordAction?: (kind: "success" | "error", text: string) => void;
};

const TITLE_WIDTH = 220;

export function AudioTrackRow({
  title,
  url,
  blob,
  trackKey,
  guilds = [],
  currentGuildId,
  onEnded,
  onError,
  onDelete,
  onRename,
  onShare,
  onDiscordAction,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shareAnchor, setShareAnchor] = useState<HTMLElement | null>(null);

  const playDiscordMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!currentGuildId) throw new Error("no guild selected");
      await audioTracksApi.playOnDiscord(trackKey, currentGuildId);
    },
    onSuccess: () => {
      onDiscordAction?.("success", "Трек воспроизводится в Discord.");
    },
    onError: (err) => {
      const text =
        err instanceof ApiError
          ? err.status === 404
            ? "Бот не в голосовом канале."
            : `Ошибка: ${err.message}. Попробуйте позже.`
          : err.message || "Не удалось воспроизвести.";
      onDiscordAction?.("error", text);
    },
  });

  const stopDiscordMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!currentGuildId) throw new Error("no guild selected");
      await audioTracksApi.stopOnDiscord(currentGuildId);
    },
    onSuccess: () => {
      onDiscordAction?.("success", "Воспроизведение в Discord остановлено.");
    },
    onError: (err) => {
      const text =
        err instanceof ApiError
          ? err.status === 404
            ? "Ничего не воспроизводится."
            : `Ошибка: ${err.message}. Попробуйте позже.`
          : err.message || "Не удалось остановить.";
      onDiscordAction?.("error", text);
    },
  });

  const handlePlay = () => {
    audioRef.current?.play().catch((e) => {
      onError?.(e instanceof Error ? e.message : "Playback failed");
    });
  };

  const handlePause = () => audioRef.current?.pause();

  const handleStop = () => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setIsPlaying(false);
  };

  const handleDownload = () => {
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = title;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnd = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnd);
    };
  }, [onEnded]);

  const shareableGuilds = guilds.filter((g) => g.id && g.id !== currentGuildId);

  const initials = (name: string | null | undefined) =>
    name?.trim().slice(0, 2).toUpperCase() || "?";

  const handleShareClick = (e: React.MouseEvent<HTMLElement>) => {
    setShareAnchor(e.currentTarget);
  };

  const handleShareClose = () => setShareAnchor(null);

  const handleSharePick = (targetGuildId: string) => {
    setShareAnchor(null);
    onShare?.(targetGuildId);
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 1.5,
        py: 0.75,
        borderRadius: 1,
        border: "1px solid",
        borderColor: (t) => `${t.col.border_light}`,
        bgcolor: (t) => `${t.col.bg_500}`,
        color: (t) => t.col.text,
        minWidth: 0,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          width: TITLE_WIDTH,
          flexShrink: 0,
          color: (t) => t.col.text,
          fontWeight: 500,
        }}
        noWrap
        title={title}
      >
        {title}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <IconButton
          size="small"
          onClick={handlePlay}
          disabled={isPlaying}
          sx={{
            color: (t) => t.col.text,
            "&:hover": { color: "#10cc19" },
          }}
          aria-label="play"
        >
          <PlayArrowIcon fontSize="small" />
        </IconButton>

        <IconButton
          size="small"
          onClick={handlePause}
          disabled={!isPlaying}
          sx={{
            color: (t) => t.col.text,
            "&:hover": { color: "#ffe96b" },
          }}
          aria-label="pause"
        >
          <PauseIcon fontSize="small" />
        </IconButton>

        <IconButton
          size="small"
          onClick={handleStop}
          sx={{
            color: (t) => t.col.text,
            "&:hover": { color: "#ff6b6b" },
          }}
          aria-label="stop"
        >
          <StopIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }} />

      {/* Discord remote controls */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
          borderLeft: "1px solid",
          borderRight: "1px solid",
          borderColor: "rgba(255,255,255,0.08)",
          px: 1,
          ml: 0.5,
        }}
      >
        <Tooltip
          title="Воспроизвести в Discord"
          arrow
          slotProps={{
            arrow: {
              sx: {
                color: (t) => t.col.bg_600,
                "&:before": {
                  border: "1px solid",
                  borderColor: (t) => t.col.border_light,
                },
              },
            },
            tooltip: {
              sx: {
                backgroundColor: (t) => t.col.bg_600,
                color: (t) => t.col.text,
                border: "1px solid",
                borderColor: (t) => t.col.border_light,
              },
            },
          }}
        >
          <span>
            <IconButton
              size="small"
              onClick={() => playDiscordMutation.mutate()}
              disabled={!currentGuildId || playDiscordMutation.isPending}
              sx={{ color: (t) => t.col.text }}
              aria-label="play on discord"
            >
              {playDiscordMutation.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <HeadphonesIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip
          title="Остановить в Discord"
          arrow
          slotProps={{
            arrow: {
              sx: {
                color: (t) => t.col.bg_600,
                "&:before": {
                  border: "1px solid",
                  borderColor: (t) => t.col.border_light,
                },
              },
            },
            tooltip: {
              sx: {
                backgroundColor: (t) => t.col.bg_600,
                color: (t) => t.col.text,
                border: "1px solid",
                borderColor: (t) => t.col.border_light,
              },
            },
          }}
        >
          <span>
            <IconButton
              size="small"
              onClick={() => stopDiscordMutation.mutate()}
              disabled={!currentGuildId || stopDiscordMutation.isPending}
              sx={{ color: "app.accent" }}
              aria-label="stop on discord"
            >
              {stopDiscordMutation.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <StopCircleIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }} />

      <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <Tooltip
          arrow
          title="Переименовать"
          slotProps={{
            arrow: {
              sx: {
                color: (t) => t.col.bg_600,
                "&:before": {
                  border: "1px solid",
                  borderColor: (t) => t.col.border_light,
                },
              },
            },
            tooltip: {
              sx: {
                backgroundColor: (t) => t.col.bg_600,
                color: (t) => t.col.text,
                border: "1px solid",
                borderColor: (t) => t.col.border_light,
              },
            },
          }}
        >
          <span>
            <IconButton
              size="small"
              onClick={onRename}
              sx={{
                color: (t) => t.col.text,
                "&:hover": { color: (t) => t.col.bg_900 },
              }}
              aria-label="rename"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip
          arrow
          title="Поделиться"
          slotProps={{
            arrow: {
              sx: {
                color: (t) => t.col.bg_600,
                "&:before": {
                  border: "1px solid",
                  borderColor: (t) => t.col.border_light,
                },
              },
            },
            tooltip: {
              sx: {
                backgroundColor: (t) => t.col.bg_600,
                color: (t) => t.col.text,
                border: "1px solid",
                borderColor: (t) => t.col.border_light,
              },
            },
          }}
        >
          <span>
            <IconButton
              size="small"
              onClick={handleShareClick}
              sx={{
                color: (t) => t.col.text,
                "&:hover": { color: (t) => t.col.bg_900 },
              }}
              aria-label="share"
            >
              <ShareIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip
          title="Скачать"
          arrow
          slotProps={{
            arrow: {
              sx: {
                color: (t) => t.col.bg_600,
                "&:before": {
                  border: "1px solid",
                  borderColor: (t) => t.col.border_light,
                },
              },
            },
            tooltip: {
              sx: {
                backgroundColor: (t) => t.col.bg_600,
                color: (t) => t.col.text,
                border: "1px solid",
                borderColor: (t) => t.col.border_light,
              },
            },
          }}
        >
          <span>
            <IconButton
              size="small"
              onClick={handleDownload}
              sx={{
                color: (t) => t.col.text,
                "&:hover": { color: (t) => t.col.bg_900 },
              }}
              aria-label="download"
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip
          arrow
          title="Удалить"
          slotProps={{
            arrow: {
              sx: {
                color: (t) => t.col.bg_600,
                "&:before": {
                  border: "1px solid",
                  borderColor: (t) => t.col.border_light,
                },
              },
            },
            tooltip: {
              sx: {
                backgroundColor: (t) => t.col.bg_600,
                color: (t) => t.col.text,
                border: "1px solid",
                borderColor: (t) => t.col.border_light,
              },
            },
          }}
        >
          <span>
            <IconButton
              size="small"
              onClick={onDelete}
              sx={{ color: (t) => t.col.text, "&:hover": { color: "#ff6b6b" } }}
              aria-label="delete"
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        crossOrigin="anonymous"
      />

      {/* Share dropdown */}
      <Menu
        anchorEl={shareAnchor}
        open={Boolean(shareAnchor)}
        onClose={handleShareClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              bgcolor: (t) => t.col.bg_600,
              backgroundImage: "none",
              border: "1px solid",
              borderColor: (t) => `${t.col.border_light}`,
              minWidth: 200,
              maxHeight: 320,
            },
          },
        }}
      >
        {shareableGuilds.length === 0 ? (
          <MenuItem disabled>
            <ListItemText primary="Нет других гильдий" />
          </MenuItem>
        ) : (
          shareableGuilds.map((g) => (
            <MenuItem
              key={g.id}
              onClick={() => handleSharePick(g.id!)}
              sx={{
                "&:hover": {
                  backgroundColor: (t) => t.col.bg_700,
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  minWidth: 0,
                }}
              >
                <Avatar
                  variant="rounded"
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "6px",
                    fontSize: 10,
                    fontWeight: 600,
                    bgcolor: (t) => `${t.col.bg_800}`,
                    color: (t) => t.col.text,
                  }}
                >
                  {initials(g.name)}
                </Avatar>
                <ListItemText
                  slotProps={{
                    primary: {
                      sx: {
                        color: (t) => t.col.text,
                        fontSize: 14,
                        textWrap: "nowrap",
                      },
                    },
                  }}
                  primary={g.name ?? "—"}
                />
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </Box>
  );
}
