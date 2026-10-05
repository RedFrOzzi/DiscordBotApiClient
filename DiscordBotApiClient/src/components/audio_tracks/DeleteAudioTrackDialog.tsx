import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { audioTracksApi } from "../../api/audioTracksApi";
import { ApiError } from "../../api/ApiError";

type Props = {
  open: boolean;
  trackKey: number | null;
  trackTitle: string;
  guildId: string | null;
  onClose: () => void;
};

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 400:
        return "Некорректные данные.";
      case 404:
        return "Трек не найден.";
      case 500:
        return "Ошибка сервера. Попробуйте позже.";
      default:
        return `Ошибка ${err.status}. Попробуйте позже.`;
    }
  }
  if (err instanceof Error) return err.message;
  return "Не удалось удалить трек.";
}

export function DeleteAudioTrackDialog({
  open,
  trackKey,
  trackTitle,
  guildId,
  onClose,
}: Props) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation<void, Error, { guildId: string; title: string }>(
    {
      mutationFn: audioTracksApi.delete,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["audio-tracks", guildId] });
        onClose();
      },
      onError: (err) => setError(errorMessage(err)),
    },
  );

  const handleClose = () => {
    if (mutation.isPending) return;
    setError(null);
    onClose();
  };

  const handleConfirm = () => {
    if (!guildId || !trackTitle || trackKey == null) return;
    setError(null);
    mutation.mutate({ guildId, title: trackTitle });
  };

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
              `linear-gradient(135deg, ${t.col.bg_global_light} 0%, ${t.col.bg_global_dark} 100%)`,
            border: "1px solid",
            borderColor: "#fc555593",
          },
        },
      }}
    >
      <DialogTitle sx={{ color: (t) => t.col.text }}>Удалить трек?</DialogTitle>

      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
      >
        {error && <Alert severity="error">{error}</Alert>}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 1.5,
            borderRadius: 1,
            border: "1px solid",
            borderColor: (t) => `${t.col.border_light}`,
            bgcolor: (t) => `${t.col.bg_500}`,
          }}
        >
          <DeleteOutlineIcon sx={{ color: "#d14545" }} />
          <Typography variant="body2" sx={{ color: (t) => t.col.text }} noWrap>
            {trackTitle}
          </Typography>
        </Box>

        <Typography
          variant="caption"
          sx={{ color: (t) => t.col.text, textAlign: "center" }}
        >
          Действие нельзя отменить.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={mutation.isPending}
          sx={{ color: (t) => t.col.text }}
        >
          Отмена
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={mutation.isPending || trackKey == null}
          startIcon={
            mutation.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <DeleteOutlineIcon />
            )
          }
          sx={{
            bgcolor: "#9b2a2a",
            color: (t) => t.col.text,
            "&:hover": { bgcolor: "#d14545" },
          }}
        >
          {mutation.isPending ? "Удаление…" : "Удалить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
