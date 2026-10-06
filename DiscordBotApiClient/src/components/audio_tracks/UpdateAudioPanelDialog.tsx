import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import TagIcon from "@mui/icons-material/Tag";
import { useMutation } from "@tanstack/react-query";
import { audioTracksApi } from "../../api/audioTracksApi";
import { ApiError } from "../../api/ApiError";
import type { DiscordChannel } from "../../api/discordApi";

type Props = {
  open: boolean;
  guildId: string | null;
  guildName?: string | null;
  channels: DiscordChannel[];
  onClose: () => void;
  onSuccess?: () => void;
};

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 400:
        return "Некорректные данные.";
      case 401:
        return "Требуется авторизация.";
      case 404:
        return "Канал или гильдия не найдены.";
      default:
        return `Ошибка ${err.status}. Попробуйте позже.`;
    }
  }
  if (err instanceof Error) return err.message;
  return "Не удалось обновить панель.";
}

export function UpdateAudioPanelDialog({
  open,
  guildId,
  guildName,
  channels,
  onClose,
  onSuccess,
}: Props) {
  const [channelId, setChannelId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset on open, and auto-pick first text channel if only one exists
  useEffect(() => {
    if (!open) return;
    setError(null);
    setSuccess(null);

    const textChannels = channels.filter((c) => c.isTextChannel);
    if (textChannels.length === 1) {
      setChannelId(textChannels[0].id);
    } else {
      setChannelId("");
    }
  }, [open, channels]);

  const mutation = useMutation<
    void,
    Error,
    { guildId: string; channelId: string }
  >({
    mutationFn: audioTracksApi.updateAudioPanel,
    onSuccess: () => {
      setSuccess("Панель успешно обновлена.");
      onSuccess?.();
    },
    onError: (err) => {
      setError(errorMessage(err));
      setSuccess(null);
    },
  });

  const handleClose = () => {
    if (mutation.isPending) return;
    onClose();
  };

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!guildId || !channelId) return;
    setError(null);
    setSuccess(null);
    mutation.mutate({ guildId, channelId });
  };

  const textChannels = channels.filter((c) => c.isTextChannel);
  const canSubmit = !!guildId && !!channelId && !mutation.isPending;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            background: (t) =>
              `linear-gradient(135deg, ${t.col.bg_global_dark} 0%, ${t.col.bg_global_light} 100%)`,
            border: "1px solid",
            borderColor: (t) => `${t.col.border}`,
          },
        },
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ color: (t) => t.col.text }}>
          Создать панель аудио
        </DialogTitle>

        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <TextField
            label="Канал"
            value={guildName ?? "—"}
            disabled
            fullWidth
            size="small"
            sx={{
              mt: 1,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: (t) => t.col.border,
              },
            }}
          />

          <FormControl
            fullWidth
            size="small"
            disabled={textChannels.length === 0}
          >
            <InputLabel id="panel-channel-label">Канал</InputLabel>
            <Select
              labelId="panel-channel-label"
              label="Канал"
              value={channelId}
              sx={{
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: (t) => t.col.border,
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: (t) => t.col.border_light,
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: (t) => t.col.border_light,
                  borderWidth: "2px",
                },
              }}
              onChange={(e) => setChannelId(e.target.value)}
              renderValue={(selected) => {
                const c = textChannels.find((x) => x.id === selected);
                if (!c) return "";
                return (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TagIcon
                      fontSize="small"
                      sx={{ color: (t) => t.col.text }}
                    />
                    <span>{c.name ?? "—"}</span>
                  </Box>
                );
              }}
              MenuProps={{
                slotProps: {
                  paper: {
                    sx: {
                      bgcolor: (t) => t.col.bg_500,
                      backgroundImage: "none",
                      border: "1px solid",
                      borderColor: (t) => `${t.col.border_light}`,
                      maxHeight: 320,
                    },
                  },
                },
              }}
            >
              {textChannels.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <TagIcon fontSize="small" sx={{ color: "app.accent" }} />
                    <span>{c.name ?? "—"}</span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {textChannels.length === 0 && (
            <Alert severity="info">В этой гильдии нет текстовых каналов.</Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={mutation.isPending}>
            Закрыть
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!canSubmit}
            startIcon={
              mutation.isPending ? <CircularProgress size={16} /> : null
            }
          >
            {mutation.isPending ? "Создание…" : "Создать"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
