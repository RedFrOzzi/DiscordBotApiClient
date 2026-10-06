import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import SystemUpdateAltIcon from "@mui/icons-material/SystemUpdateAlt";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useMutation } from "@tanstack/react-query";
import { discordApi } from "../../api/discordApi";
import { ApiError } from "../../api/ApiError";

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 401:
      case 403:
        return "Недостаточно прав.";
      case 500:
        return "Ошибка сервера. Попробуйте позже.";
      default:
        return `Ошибка ${err.status}. Попробуйте позже.`;
    }
  }
  if (err instanceof Error) return err.message;
  return "Не удалось запустить обновление сервера.";
}

export function UpdateServerSection() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mutation = useMutation<void, Error, void>({
    mutationFn: discordApi.updateServer,
    onSuccess: () => {
      setSuccess("Обновление сервера запущено.");
      setError(null);
      setConfirmOpen(false);
    },
    onError: (err) => {
      setError(errorMessage(err));
      setSuccess(null);
      setConfirmOpen(false);
    },
  });

  const openConfirm = () => {
    setError(null);
    setSuccess(null);
    setConfirmOpen(true);
  };

  const handleClose = () => {
    if (mutation.isPending) return;
    setConfirmOpen(false);
  };

  const handleConfirm = () => {
    mutation.mutate();
  };

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{ color: (t) => t.col.text, mb: 2, fontSize: "1.05rem" }}
      >
        Обновление сервера
      </Typography>

      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <Button
            variant="contained"
            size="large"
            onClick={openConfirm}
            disabled={mutation.isPending}
            startIcon={
              mutation.isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SystemUpdateAltIcon />
              )
            }
            sx={{
              px: 5,
              py: 1.75,
              fontSize: "1rem",
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            {mutation.isPending ? "Запуск обновления…" : "Обновить сервер"}
          </Button>
        </Box>
      </Stack>

      <Dialog
        open={confirmOpen}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              background: (t) =>
                `linear-gradient(135deg, ${t.col.bg_global_light} 0%, ${t.col.bg_global_dark} 100%)`,
              border: "1px solid",
              borderColor: "#ffb54755",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            color: (t) => t.col.text,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <WarningAmberIcon sx={{ color: "#ffb547" }} />
          Обновить сервер?
        </DialogTitle>

        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
          <Typography variant="body2" sx={{ color: (t) => t.col.text }}>
            Сервер будет перезапущен для применения обновлений. Активные
            операции и соединения будут прерваны.
          </Typography>
          <Typography variant="caption" sx={{ color: (t) => t.col.text }}>
            Действие нельзя отменить.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={mutation.isPending}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={mutation.isPending}
            startIcon={
              mutation.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SystemUpdateAltIcon />
              )
            }
            sx={{
              bgcolor: "#e5a10a",
              color: "#1a1200",
              "&:hover": { bgcolor: "#c98d08" },
              "&.Mui-disabled": {
                bgcolor: "rgba(229, 161, 10, 0.35)",
                color: "rgba(26, 18, 0, 0.6)",
              },
            }}
          >
            {mutation.isPending ? "Запуск…" : "Обновить"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
