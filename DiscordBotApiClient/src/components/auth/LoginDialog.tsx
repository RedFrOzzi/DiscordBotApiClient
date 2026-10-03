import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Box,
  useTheme,
} from "@mui/material";
import { useAuth } from "../../auth/useAuth";
import { ApiError } from "../../api/ApiError";

export type AuthMode = "login" | "register";

type Props = {
  open: boolean;
  mode: AuthMode;
  onClose: () => void;
};

function errorMessage(err: unknown, mode: AuthMode): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 400:
        return "Некорректный логин или пароль.";
      case 409:
        return "Пользователь с таким логином уже существует.";
      case 500:
        return "Ошибка сервера. Попробуйте позже.";
      default:
        return `Ошибка ${err.status}. Попробуйте позже.`;
    }
  }
  if (err instanceof Error) return err.message;
  return mode === "register"
    ? "Не удалось создать пользователя."
    : "Не удалось войти.";
}

export function LoginDialog({ open, mode, onClose }: Props) {
  const { login, register } = useAuth();
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === "register";

  const theme = useTheme();

  const reset = () => {
    setLoginValue("");
    setPassword("");
    setError(null);
    setSubmitting(false);
  };

  useEffect(() => {
    if (open) reset();
  }, [open, mode]);

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isRegister) await register(loginValue, password);
      else await login(loginValue, password);
      reset();
      onClose();
    } catch (err) {
      setError(errorMessage(err, mode));
      setSubmitting(false);
    }
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
            borderColor: (t) => `${t.col.details}`,
          },
        },
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle align="center">Введите данные</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Логин"
            value={loginValue}
            onChange={(e) => setLoginValue(e.target.value)}
            autoFocus
            fullWidth
            required
            disabled={submitting}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            disabled={submitting}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={submitting}>
            Отмена
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !loginValue || !password}
            startIcon={submitting ? <CircularProgress size={16} /> : null}
            sx={{
              bgcolor: theme.col.accent,
              color: "#052016",
              "&:hover": {
                bgcolor: theme.col.details,
                filter: "brightness(1.1)",
              },
            }}
          >
            {submitting
              ? isRegister
                ? "Создание…"
                : "Вход…"
              : isRegister
                ? "Создать"
                : "Войти"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
