import { useEffect, useState } from "react";
import {
  Box,
  Avatar,
  ButtonBase,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Snackbar,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDiscordData } from "../../api/useDiscordData";
import { useAudioTracks } from "../../api/useAudioTracks";
import { AudioTrackRowWithBlob } from "./AudioTrackRowWithBlob";
import { Button, Tooltip } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import { UpdateAudioPanelDialog } from "./UpdateAudioPanelDialog";
import { UploadAudioTrackDialog } from "./UploadAudioTrackDialog";
import { RenameAudioTrackDialog } from "./RenameAudioTrackDialog";
import type { AudioTrackDto } from "../../api/audioTracksApi";
import { DeleteAudioTrackDialog } from "./DeleteAudioTrackDialog";
import { audioTracksApi } from "../../api/audioTracksApi";
import { ApiError } from "../../api/ApiError";

export function AudioTracksTab() {
  const {
    guilds,
    channelsByGuild,
    isLoading: guildsLoading,
    isError: guildsError,
  } = useDiscordData();

  const queryClient = useQueryClient();

  const [trackToDelete, setTrackToDelete] = useState<AudioTrackDto | null>(
    null,
  );
  const [guildId, setGuildId] = useState<string | null>(null);
  const [panelDialogOpen, setPanelDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [trackToRename, setTrackToRename] = useState<AudioTrackDto | null>(
    null,
  );
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!guildId && guilds.length > 0 && guilds[0].id) {
      setGuildId(guilds[0].id);
    }
    if (guildId && !guilds.some((g) => g.id === guildId)) {
      setGuildId(guilds[0]?.id ?? null);
    }
  }, [guilds, guildId]);

  const shareMutation = useMutation<
    void,
    Error,
    { key: number; guildId: string }
  >({
    mutationFn: audioTracksApi.share,
    onSuccess: (_data, vars) => {
      const target = guilds.find((g) => g.id === vars.guildId);
      setFeedback({
        kind: "success",
        text: `Трек сохранён в «${target?.name ?? vars.guildId}».`,
      });
      // Invalidate all audio-tracks queries on guild change
      queryClient.invalidateQueries({ queryKey: ["audio-tracks"] });
    },
    onError: (err) => {
      const text =
        err instanceof ApiError
          ? err.status === 404
            ? "Трек или канал не найдены."
            : err.status === 409
              ? "Этот трек уже есть в канале."
              : `Ошибка ${err.status}. Попробуйте позже.`
          : "Не удалось поделиться треком.";
      setFeedback({ kind: "error", text });
    },
  });

  const tracksQuery = useAudioTracks(guildId);
  const selectedGuild = guilds.find((g) => g.id === guildId) ?? null;
  const guildChannels = guildId ? (channelsByGuild.get(guildId) ?? []) : [];

  if (guildsLoading) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (guildsError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Не удалось загрузить гильдии.</Alert>
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

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 420,
        minWidth: 0,
      }}
    >
      {/* Toolbar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 2,
          borderBottom: "1px solid",
          borderColor: (t) => `${t.col.border_light}`,
          flexShrink: 0,
        }}
      >
        <Tooltip
          arrow
          title="Обновить список"
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
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => tracksQuery.refetch()}
            disabled={!guildId || tracksQuery.isFetching}
            sx={{
              color: (t) => t.col.text,
              backgroundColor: (t) => t.col.bg_500,
              borderColor: (t) => `${t.col.border_light}90`,
              "&:hover": {
                borderColor: (t) => t.col.border_light,
                bgcolor: (t) => `${t.col.bg_700}`,
              },
            }}
          >
            Обновить
          </Button>
        </Tooltip>

        <Tooltip
          arrow
          title="Загрузить новый трек"
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
          <Button
            size="small"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            disabled={!guildId}
            onClick={() => setUploadDialogOpen(true)}
            sx={{
              color: (t) => t.col.text,
              backgroundColor: (t) => t.col.bg_500,
              borderColor: (t) => `${t.col.border_light}90`,
              "&:hover": {
                borderColor: (t) => t.col.border_light,
                bgcolor: (t) => `${t.col.bg_700}`,
              },
            }}
          >
            Загрузить
          </Button>
        </Tooltip>

        <Box sx={{ flex: 1 }} />
        <Tooltip
          arrow
          title="Создать панель аудиотреков в дискорде"
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
          <Button
            size="small"
            variant="contained"
            startIcon={<DashboardCustomizeIcon />}
            disabled={!guildId}
            onClick={() => setPanelDialogOpen(true)}
          >
            Создать панель
          </Button>
        </Tooltip>
      </Box>

      {/* Guilds */}
      <Box sx={{ display: "flex", flex: 1, minHeight: 0, minWidth: 0 }}>
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
                  borderColor: (t) =>
                    selected ? t.col.details : "transparent",
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

        {/* Audio tracks */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: "1px solid",
              borderColor: (t) => `${t.col.border_light}`,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ color: "app.text", fontWeight: 600 }}
              noWrap
            >
              Аудиотреки
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              width: "550px",
              overflowY: "auto",
              p: 2,
            }}
          >
            {tracksQuery.isLoading ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <CircularProgress size={28} />
              </Box>
            ) : tracksQuery.isError ? (
              <Alert severity="error">Не удалось загрузить треки.</Alert>
            ) : !tracksQuery.data || tracksQuery.data.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  В этой гильдии нет аудиотреков.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {tracksQuery.data.map((t) => (
                  <AudioTrackRowWithBlob
                    key={t.key}
                    track={t}
                    guilds={guilds}
                    onDelete={() => setTrackToDelete(t)}
                    onRename={() => setTrackToRename(t)}
                    onShare={(targetGuildId) =>
                      shareMutation.mutate({
                        key: t.key,
                        guildId: targetGuildId,
                      })
                    }
                  />
                ))}
              </Stack>
            )}
          </Box>
        </Box>
      </Box>
      <UpdateAudioPanelDialog
        open={panelDialogOpen}
        guildId={guildId}
        guildName={selectedGuild?.name ?? null}
        channels={guildChannels}
        onClose={() => setPanelDialogOpen(false)}
        onSuccess={() => {
          setTimeout(() => setPanelDialogOpen(false), 1200);
        }}
      />

      <UploadAudioTrackDialog
        open={uploadDialogOpen}
        guildId={guildId}
        guildName={selectedGuild?.name ?? null}
        onClose={() => setUploadDialogOpen(false)}
      />

      <RenameAudioTrackDialog
        open={!!trackToRename}
        trackKey={trackToRename?.key ?? null}
        currentTitle={trackToRename?.title ?? ""}
        guildId={guildId}
        onClose={() => setTrackToRename(null)}
      />

      <DeleteAudioTrackDialog
        open={!!trackToDelete}
        trackKey={trackToDelete?.key ?? null}
        trackTitle={trackToDelete?.title ?? ""}
        guildId={guildId}
        onClose={() => setTrackToDelete(null)}
      />

      <Snackbar
        open={!!feedback}
        autoHideDuration={3000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={feedback?.kind ?? "info"}
          variant="filled"
          onClose={() => setFeedback(null)}
        >
          {feedback?.text ?? ""}
        </Alert>
      </Snackbar>
    </Box>
  );
}
