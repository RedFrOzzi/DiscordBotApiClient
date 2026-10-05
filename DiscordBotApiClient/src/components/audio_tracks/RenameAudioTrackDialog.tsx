import { useEffect, useState, type FormEvent } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Box,
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { audioTracksApi } from "../../api/audioTracksApi";
import { ApiError } from "../../api/ApiError";

type Props = {
  open: boolean;
  trackKey: number | null;
  currentTitle: string;
  guildId: string | null;
  onClose: () => void;
};

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 400:
        return "Некорректное название.";
      case 401:
        return "Требуется авторизация.";
      case 404:
        return "Трек не найден.";
      case 409:
        return "Трек с таким названием уже существует.";
      case 500:
        return "Ошибка сервера. Попробуйте позже.";
      default:
        return `Ошибка ${err.status}. Попробуйте позже.`;
    }
  }
  if (err instanceof Error) return err.message;
  return "Не удалось переименовать.";
}

export function RenameAudioTrackDialog({
  open,
  trackKey,
  currentTitle,
  guildId,
  onClose,
}: Props) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(currentTitle);
  const [error, setError] = useState<string | null>(null);

  // Reset when opened / when the track changes
  useEffect(() => {
    if (!open) return;
    setTitle(currentTitle);
    setError(null);
  }, [open, currentTitle, trackKey]);

  const mutation = useMutation<void, Error, { key: number; newTitle: string }>({
    mutationFn: audioTracksApi.rename,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audio-tracks", guildId] });
      onClose();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const handleClose = () => {
    if (mutation.isPending) return;
    onClose();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (trackKey == null) return;
    const trimmed = title.trim();
    if (!trimmed || trimmed === currentTitle) return;
    setError(null);
    mutation.mutate({ key: trackKey, newTitle: trimmed });
  };

  const canSubmit =
    trackKey != null &&
    title.trim().length > 0 &&
    title.trim() !== currentTitle &&
    !mutation.isPending;

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
        <DialogTitle sx={{ color: "app.text" }}>Переименовать трек</DialogTitle>

        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
          {error && <Alert severity="error">{error}</Alert>}

          <Typography variant="caption" color="text.secondary">
            Текущее название: {currentTitle}
          </Typography>

          <TextField
            label="Новое название"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
            }}
            autoFocus
            fullWidth
            size="small"
            disabled={mutation.isPending}
            slotProps={{ htmlInput: { maxLength: 79 } }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={mutation.isPending}>
            Отмена
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!canSubmit}
            startIcon={
              mutation.isPending ? <CircularProgress size={16} /> : <EditIcon />
            }
          >
            {mutation.isPending ? "Сохранение…" : "Сохранить"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
