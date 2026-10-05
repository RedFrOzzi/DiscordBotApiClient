import { useEffect, useRef, useState, type FormEvent } from "react";
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
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { audioTracksApi } from "../../api/audioTracksApi";
import { ApiError } from "../../api/ApiError";

type Props = {
  open: boolean;
  guildId: string | null;
  guildName?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
};

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 400:
        return "Проверьте название и файл.";
      case 409:
        return "Трек с таким названием уже существует.";
      case 500:
        return "Ошибка сервера. Попробуйте позже.";
      default:
        return `Ошибка ${err.status}. Попробуйте позже.`;
    }
  }
  if (err instanceof Error) return err.message;
  return "Не удалось загрузить трек.";
}

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export function UploadAudioTrackDialog({
  open,
  guildId,
  guildName,
  onClose,
  onSuccess,
}: Props) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setFile(null);
    setError(null);
    setSuccess(null);
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  const mutation = useMutation<void, Error, { title: string; file: File }>({
    mutationFn: ({ title, file }) =>
      audioTracksApi.upload({ title, file, guildId: guildId! }),
    onSuccess: () => {
      setSuccess("Трек успешно загружен.");
      setError(null);

      queryClient.invalidateQueries({ queryKey: ["audio-tracks", guildId] });

      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
      closeTimerRef.current = window.setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    },
    onError: (err) => {
      setError(errorMessage(err));
      setSuccess(null);
    },
  });

  const handleFile = (f: File | null) => {
    setFile(f);
    // Auto-fill title from filename if empty
    if (f && !title.trim()) {
      const name = f.name.replace(/\.[^.]+$/, "");
      setTitle(name.slice(0, 79));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file || !title.trim() || !guildId) return;
    mutation.mutate({ title: title.trim(), file });
  };

  const handleClose = () => {
    if (mutation.isPending) return;
    onClose();
  };

  const isBusy = mutation.isPending || !!success;

  const canSubmit = !!file && !!title.trim() && !!guildId && !isBusy;

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
              `linear-gradient(135deg, ${t.col.bg_global_light} 0%, ${t.col.bg_global_light} 100%)`,
            border: "1px solid",
            borderColor: (t) => `${t.col.border}`,
          },
        },
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ color: "app.text" }}>Загрузить трек</DialogTitle>

        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <TextField
            label="Гильдия"
            value={guildName ?? "—"}
            disabled
            fullWidth
            size="small"
          />

          {/* File picker */}
          <Box
            onClick={() => inputRef.current?.click()}
            sx={{
              border: "1px dashed",
              borderColor: (t) => `${t.col.border}`,
              borderRadius: 2,
              p: 2,
              textAlign: "center",
              cursor: mutation.isPending ? "default" : "pointer",
              "&:hover": mutation.isPending
                ? {}
                : {
                    borderColor: (t) => t.col.border,
                    bgcolor: (t) => `${t.col.bg_400}`,
                  },
              transition: "border-color .15s, background-color .15s",
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="audio/*"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  justifyContent: "center",
                }}
              >
                <InsertDriveFileIcon
                  fontSize="small"
                  sx={{ color: "app.accent" }}
                />
                <Typography variant="body2" sx={{ color: "app.text" }} noWrap>
                  {file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({humanSize(file.size)})
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFile(null);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                  disabled={isBusy}
                  aria-label="remove file"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <CloudUploadIcon sx={{ color: "app.accent" }} />
                <Typography variant="body2" color="text.secondary">
                  Нажмите, чтобы выбрать файл
                </Typography>
              </Box>
            )}
          </Box>

          <TextField
            label="Название"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isBusy}
            fullWidth
            size="small"
            slotProps={{ htmlInput: { maxLength: 79 } }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={isBusy}>
            Отмена
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!canSubmit}
            startIcon={
              mutation.isPending ? (
                <CircularProgress size={16} />
              ) : (
                <CloudUploadIcon />
              )
            }
          >
            {mutation.isPending ? "Загрузка…" : "Загрузить"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
