import { useEffect, useState } from "react";
import {
  Box,
  Avatar,
  ButtonBase,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  useTheme,
} from "@mui/material";
import TagIcon from "@mui/icons-material/Tag";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import SendIcon from "@mui/icons-material/Send";
import ChatIcon from "@mui/icons-material/Chat";
import MicIcon from "@mui/icons-material/Mic";
import ViewQuiltIcon from "@mui/icons-material/ViewQuilt";
import { useMutation } from "@tanstack/react-query";
import { useDiscordData } from "../../api/useDiscordData";
import { ApiError } from "../../api/ApiError";
import { discordApi, type DiscordChannel } from "../../api/discordApi";
import { EmbedBuilder } from "./embed/EmbedBuilder";
import { useEmbed } from "./embed/EmbedProvider";
import { buildEmbedPayload, hasEmbedContent } from "../../api/embedPayload";

type SendMode = "text" | "voice" | "embed";

const MODE_LABELS: Record<SendMode, string> = {
  text: "Сообщение",
  embed: "Embed",
  voice: "Голосовое",
};

function isModeAllowed(mode: SendMode, channel: DiscordChannel): boolean {
  if (mode === "text") return !!channel.isTextChannel;
  if (mode === "voice") return channel.isTextChannel === false;
  if (mode === "embed") return !!channel.isTextChannel;
  return false;
}

function firstAllowedMode(channel: DiscordChannel): SendMode {
  return channel.isTextChannel ? "text" : "voice";
}

export function MessagingTab() {
  const { guilds, channelsByGuild, isLoading, isError } = useDiscordData();
  const { embed } = useEmbed();

  const [guildId, setGuildId] = useState<string | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [mode, setMode] = useState<SendMode>("text");
  const [content, setContent] = useState("");
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    text: string;
  } | null>(null);

  const theme = useTheme();

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(t);
  }, [feedback]);

  // Auto-select first guild
  useEffect(() => {
    if (!guildId && guilds.length > 0 && guilds[0].id) {
      setGuildId(guilds[0].id);
    }
    if (guildId && !guilds.some((g) => g.id === guildId)) {
      setGuildId(guilds[0]?.id ?? null);
    }
  }, [guilds, guildId]);

  const channels = guildId ? (channelsByGuild.get(guildId) ?? []) : [];

  // Reset channel + mode + content when guild changes
  useEffect(() => {
    setChannelId(null);
    setMode("text");
    setContent("");
    setFeedback(null);
  }, [guildId]);

  const selectedChannel = channelId
    ? (channels.find((c) => c.id === channelId) ?? null)
    : null;

  // Auto-switch to an allowed mode when channel changes
  useEffect(() => {
    if (!selectedChannel) return;
    if (!isModeAllowed(mode, selectedChannel)) {
      setMode(firstAllowedMode(selectedChannel));
    }
  }, [selectedChannel, mode]);

  const mutation = useMutation<void, Error, void>({
    mutationFn: () => {
      if (!selectedChannel) throw new Error("no channel");

      if (mode === "embed") {
        if (!hasEmbedContent(embed)) throw new Error("empty embed");
        return discordApi.sendEmbed(
          selectedChannel.id,
          buildEmbedPayload(embed),
        );
      }

      const trimmed = content.trim();
      if (!trimmed) throw new Error("empty message");

      if (mode === "text") {
        return discordApi.sendMessage(selectedChannel.id, trimmed);
      }
      if (mode === "voice") {
        return discordApi.sendVoiceMessage(selectedChannel.id, trimmed);
      }
      throw new Error("embed not implemented");
    },
    onSuccess: () => {
      setFeedback({ kind: "success", text: "Отправлено." });
      if (mode !== "embed") setContent("");
    },
    onError: (err) => {
      const text =
        err instanceof ApiError
          ? `Ошибка ${err.status}. Попробуйте позже.`
          : err.message || "Не удалось отправить.";
      setFeedback({ kind: "error", text });
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Не удалось загрузить данные.</Alert>
      </Box>
    );
  }

  if (guilds.length === 0) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <Typography color="text.secondary">Нет доступных гильдий.</Typography>
      </Box>
    );
  }

  const canSend = (() => {
    if (!selectedChannel) return false;
    if (!isModeAllowed(mode, selectedChannel)) return false;
    if (mutation.isPending) return false;
    if (mode === "embed") return hasEmbedContent(embed);
    return content.trim().length > 0;
  })();

  return (
    <Box sx={{ display: "flex", height: "100%", minHeight: 420, minWidth: 0 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          p: 1.5,
          overflowY: "auto",
          borderRight: "1px solid",
          borderColor: (t) => `${t.col.border_light}`,
          flexShrink: 0,
        }}
      >
        {guilds.map((g) => {
          if (!g.id) return null;
          const selected = g.id === guildId;
          const initials = g.name?.trim().slice(0, 2).toUpperCase() || "?";
          const icon = g.iconUrl;
          return (
            <ButtonBase
              key={g.id}
              onClick={() => setGuildId(g.id)}
              title={g.name ?? undefined}
              sx={{
                borderRadius: "10px",
                p: 0.5,
                border: "2px solid",
                borderColor: selected ? theme.col.details : "transparent",
                transition: "border-color .15s",
                "&:hover": {
                  borderColor: (t) => `${t.col.border_light}`,
                },
              }}
            >
              <Avatar
                src={icon || undefined}
                variant="rounded"
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "8px",
                  bgcolor: (t) => `${t.col.bg_300}`,
                  color: (t) => t.col.text,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {initials}
              </Avatar>
            </ButtonBase>
          );
        })}
      </Box>

      {/* Сhannels */}
      <Box
        sx={{
          width: 240,
          flexShrink: 0,
          overflowY: "auto",
          borderRight: "1px solid",
          borderColor: (t) => `${t.col.border_light}`,
          py: 1,
        }}
      >
        {channels.length === 0 ? (
          <Box sx={{ py: 5, textAlign: "center" }}>
            <Typography variant="body2" color="col.text">
              Нет каналов.
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {channels.map((c) => {
              const selected = c.id === channelId;
              return (
                <ListItem
                  key={c.id}
                  disableGutters
                  onClick={() => setChannelId(c.id)}
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    cursor: "pointer",
                    bgcolor: selected
                      ? (t) => `${t.col.bg_box_dark}65`
                      : "transparent",
                    "&:hover": {
                      bgcolor: (t) => `${t.col.bg_box_light}70`,
                    },
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 32 }}>
                    {c.isTextChannel ? (
                      <TagIcon
                        fontSize="small"
                        sx={{ color: theme.col.text }}
                      />
                    ) : (
                      <VolumeUpIcon
                        fontSize="small"
                        sx={{ color: theme.col.text }}
                      />
                    )}
                  </ListItemAvatar>
                  <ListItemText
                    primary={c.name ?? "—"}
                    slotProps={{
                      primary: {
                        color: theme.col.text,
                        sx: {
                          fontSize: 14,
                          textWrap: "nowrap",
                        },
                      },
                    }}
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>

      {/* Main window */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          pt: 2,
          pr: 2,
          pb: 2,
          gap: 2,
        }}
      >
        {!selectedChannel ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="body2" sx={{ color: theme.col.text }}>
              Выберите канал
            </Typography>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                pl: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
                minWidth: 0,
              }}
            >
              {selectedChannel.isTextChannel ? (
                <TagIcon fontSize="small" sx={{ color: theme.col.text }} />
              ) : (
                <VolumeUpIcon fontSize="small" sx={{ color: theme.col.text }} />
              )}
              <Typography
                variant="subtitle1"
                sx={{ color: theme.col.text, fontWeight: 600 }}
                noWrap
              >
                {selectedChannel.name ?? "—"}
              </Typography>
            </Box>

            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_e, v: SendMode | null) => {
                if (v) {
                  setMode(v);
                  setFeedback(null);
                }
              }}
              size="small"
              sx={{
                pl: 2,
                "& .MuiToggleButton-root": {
                  textTransform: "none",
                  backgroundColor: `${theme.col.bg_600}`,
                  color: `${theme.col.text}80`,
                  borderColor: `${theme.col.border_light}`,
                  "&:hover": {
                    bgcolor: `${theme.col.bg_700}`,
                  },
                  "&.Mui-disabled": {
                    bgcolor: "transparent",
                    borderColor: `${theme.col.border}`,
                  },
                  "&.Mui-selected": {
                    bgcolor: `${theme.col.bg_800}70`,
                    color: `${theme.col.text}`,
                    borderColor: `${theme.col.border_light}`,
                    "&:hover": {
                      bgcolor: `${theme.col.bg_800}`,
                    },
                  },
                },
              }}
            >
              {(Object.keys(MODE_LABELS) as SendMode[]).map((m) => {
                const allowed = isModeAllowed(m, selectedChannel);
                const button = (
                  <ToggleButton
                    key={m}
                    value={m}
                    disabled={!allowed}
                    sx={{ gap: 0.75 }}
                  >
                    {m === "text" && <ChatIcon fontSize="small" />}
                    {m === "embed" && <ViewQuiltIcon fontSize="small" />}
                    {m === "voice" && <MicIcon fontSize="small" />}
                    {MODE_LABELS[m]}
                  </ToggleButton>
                );
                return allowed ? (
                  button
                ) : (
                  <Tooltip
                    key={m}
                    title={
                      m === "voice"
                        ? "Только для голосовых каналов"
                        : "Только для текстовых каналов"
                    }
                    slotProps={{
                      tooltip: {
                        sx: {
                          color: theme.col.text,
                          backgroundColor: theme.col.bg_global_light,
                          border: `1px solid ${theme.col.border}`,
                        },
                      },
                    }}
                  >
                    <span>{button}</span>
                  </Tooltip>
                );
              })}
            </ToggleButtonGroup>

            <Divider sx={{ borderColor: (t) => `${t.col.border_light}` }} />

            {mode === "embed" ? (
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  mx: 2,
                  py: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflowY: "auto",
                  border: "1px solid",
                  borderColor: (t) => `${t.col.border_light}`,
                  borderRadius: 1,
                }}
              >
                <EmbedBuilder />
              </Box>
            ) : (
              <TextField
                placeholder={
                  mode === "voice"
                    ? "Введите текст, который бот озвучит…"
                    : "Введите сообщение…"
                }
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setFeedback(null);
                }}
                multiline
                minRows={5}
                fullWidth
                disabled={mutation.isPending}
                sx={{
                  pl: 2,
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: `${theme.col.border_light}80`,
                    },
                    "&:hover fieldset": {
                      borderColor: theme.col.border_light,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: theme.col.border_light,
                    },
                  },
                }}
              />
            )}

            {feedback && (
              <Alert severity={feedback.kind}>{feedback.text}</Alert>
            )}

            <Box sx={{ pl: 2, display: "flex", justifyContent: "flex-start" }}>
              <Button
                variant="contained"
                onClick={() => {
                  setFeedback(null);
                  mutation.mutate();
                }}
                disabled={!canSend}
                startIcon={
                  mutation.isPending ? (
                    <CircularProgress size={16} />
                  ) : (
                    <SendIcon />
                  )
                }
              >
                {mutation.isPending ? "Отправка…" : "Отправить"}
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
