import { useState, useEffect } from "react";
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
} from "@mui/material";
import { authApi } from "../../auth/authApi";
import { ApiError } from "../../api/ApiError";

type Props = {
  open: boolean;
  onClose: () => void;
};

type FormState = {
  login: string;
  password: string;
  keyword: string;
  newAdminLogin: string;
};

const empty: FormState = {
  login: "",
  password: "",
  keyword: "",
  newAdminLogin: "",
};

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 400:
        return "Проверьте заполнение всех полей.";
      case 404:
        return "Пользователь не найден.";
      case 500:
        return "Ошибка сервера. Попробуйте позже.";
      default:
        return `Ошибка ${err.status}. Попробуйте позже.`;
    }
  }
  if (err instanceof Error) return err.message;
  return "Не удалось выполнить операцию.";
}

export function AdminVerificationDialog({ open, onClose }: Props) {
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(empty);
      setError(null);
      setSuccess(null);
      setSubmitting(false);
    }
  }, [open]);

  const setField =
    (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await authApi.createAdmin(form);
      setSuccess(
        `Пользователь «${form.newAdminLogin}» назначен администратором.`,
      );
      setForm(empty);
      setSubmitting(false);
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  };

  const canSubmit =
    form.login.trim() &&
    form.password &&
    form.keyword &&
    form.newAdminLogin.trim();

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
            borderColor: (t) => `${t.col.border}`,
          },
        },
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ color: "app.text" }}>
          Назначение администратора
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <TextField
            label="Ваш логин"
            value={form.login}
            onChange={setField("login")}
            fullWidth
            required
            disabled={submitting}
          />
          <TextField
            label="Ваш пароль"
            type="password"
            value={form.password}
            onChange={setField("password")}
            fullWidth
            required
            disabled={submitting}
          />
          <TextField
            label="Ключевое слово"
            value={form.keyword}
            onChange={setField("keyword")}
            fullWidth
            required
            disabled={submitting}
          />
          <TextField
            label="Логин нового администратора"
            value={form.newAdminLogin}
            onChange={setField("newAdminLogin")}
            fullWidth
            required
            disabled={submitting}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={submitting}>
            Закрыть
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !canSubmit}
            startIcon={submitting ? <CircularProgress size={16} /> : null}
          >
            {submitting ? "Отправка…" : "Подтвердить"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
