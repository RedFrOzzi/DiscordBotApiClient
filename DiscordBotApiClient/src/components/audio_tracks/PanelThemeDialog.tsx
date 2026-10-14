import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import PaletteIcon from "@mui/icons-material/Palette";
import { useMutation } from "@tanstack/react-query";
import {
  audioTracksApi,
  PANEL_THEMES,
  type PanelTheme,
} from "../../api/audioTracksApi";
import { ApiError } from "../../api/ApiError";

type Props = {
  open: boolean;
  guildId: string | null;
  guildName?: string | null;
  onClose: () => void;
  onSuccess?: (theme: PanelTheme) => void;
};

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 400:
        return "Некорректный запрос.";
      case 401:
        return "Требуется авторизация.";
      case 404:
        return "Гильдия не найдена.";
      default:
        return `Ошибка ${err.status}. Попробуйте позже.`;
    }
  }
  if (err instanceof Error) return err.message;
  return "Не удалось изменить тему.";
}

export function PanelThemeDialog({
  open,
  guildId,
  guildName,
  onClose,
  onSuccess,
}: Props) {
  const [theme, setTheme] = useState<PanelTheme>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTheme(0);
    setError(null);
  }, [open]);

  const mutation = useMutation<void, Error, PanelTheme>({
    mutationFn: (t) => {
      if (!guildId) throw new Error("no guild");
      return audioTracksApi.setPanelTheme(guildId, t);
    },
    onSuccess: (_data, t) => {
      onSuccess?.(t);
      onClose();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const handleClose = () => {
    if (mutation.isPending) return;
    onClose();
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
            borderColor: (t) => t.col.border_light,
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
        <PaletteIcon sx={{ color: (t) => t.col.text }} />
        Тема панели аудио
      </DialogTitle>

      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
      >
        {error && <Alert severity="error">{error}</Alert>}

        {guildName && (
          <Typography variant="body2" sx={{ color: (t) => t.col.text }}>
            Гильдия: {guildName}
          </Typography>
        )}

        <RadioGroup
          value={String(theme)}
          onChange={(e) => setTheme(Number(e.target.value) as PanelTheme)}
        >
          {PANEL_THEMES.map((t) => (
            <FormControlLabel
              key={t.value}
              value={String(t.value)}
              disabled={mutation.isPending}
              control={
                <Radio
                  size="small"
                  sx={{
                    color: (t) => t.col.text,
                    "&.Mui-checked": { color: (t) => t.col.details },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: (t) => t.col.text }}>
                  {t.label}
                </Typography>
              }
            />
          ))}
        </RadioGroup>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={mutation.isPending}>
          Отмена
        </Button>
        <Button
          variant="contained"
          onClick={() => mutation.mutate(theme)}
          disabled={mutation.isPending || !guildId}
          startIcon={
            mutation.isPending && <CircularProgress size={16} color="inherit" />
          }
        >
          {mutation.isPending ? "Сохранение…" : "Применить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
