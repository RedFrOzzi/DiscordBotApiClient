import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import { discordApi, type AddModeratorDto } from "../../api/discordApi";
import { ApiError } from "../../api/ApiError";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { UpdateGuildDataSection } from "./UpdateGuildDataSection";
import { useAuth } from "../../auth/useAuth";
import { UpdateUsersSection } from "./UpdateUsersSection";
import { UpdateServerSection } from "./UpdateServerSection";

const emptyForm: AddModeratorDto = {
  login: "",
  password: "",
  newModeratorLogin: "",
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

export function AdminDashboard() {
  const { isAdmin } = useAuth();

  return (
    <Box sx={{ p: 3 }}>
      <CreateModeratorSection />
      <SectionDivider />
      {isAdmin && (
        <>
          <UpdateGuildDataSection />
          <SectionDivider />
        </>
      )}
      {isAdmin && (
        <>
          <UpdateUsersSection />
          <SectionDivider />
        </>
      )}
      {isAdmin && (
        <>
          <UpdateServerSection />
          <SectionDivider />
        </>
      )}
    </Box>
  );
}

function SectionDivider() {
  return (
    <Divider
      sx={{
        my: 3,
        borderColor: (t) => t.col.border_light,
      }}
    />
  );
}

function CreateModeratorSection() {
  const [form, setForm] = useState<AddModeratorDto>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mutation = useMutation<void, Error, AddModeratorDto>({
    mutationFn: discordApi.createModerator,
    onSuccess: () => {
      setSuccess(`Модератор «${form.newModeratorLogin}» создан.`);
      setForm(emptyForm);
      setError(null);
    },
    onError: (err) => {
      setError(errorMessage(err));
      setSuccess(null);
    },
  });

  const setField =
    (key: keyof AddModeratorDto) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const canSubmit =
    form.login.trim() &&
    form.password &&
    form.newModeratorLogin.trim() &&
    !mutation.isPending;

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    mutation.mutate(form);
  };

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{ color: (t) => t.col.text, mb: 2, fontSize: "1.05rem" }}
      >
        Назначить модератора
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <TextField
          label="Ваш логин"
          value={form.login}
          onChange={setField("login")}
          size="small"
          required
          disabled={mutation.isPending}
          fullWidth
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: (t) => `${t.col.border_light}90`,
              },
              "&:hover fieldset": {
                borderColor: (t) => t.col.border_light,
              },
              "&.Mui-focused fieldset": {
                borderColor: (t) => t.col.border_light,
              },
            },
          }}
        />
        <TextField
          label="Ваш пароль"
          type="password"
          value={form.password}
          onChange={setField("password")}
          size="small"
          required
          disabled={mutation.isPending}
          fullWidth
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: (t) => `${t.col.border_light}90`,
              },
              "&:hover fieldset": {
                borderColor: (t) => t.col.border_light,
              },
              "&.Mui-focused fieldset": {
                borderColor: (t) => t.col.border_light,
              },
            },
          }}
        />
        <TextField
          label="Логин нового модератора"
          value={form.newModeratorLogin}
          onChange={setField("newModeratorLogin")}
          size="small"
          required
          disabled={mutation.isPending}
          fullWidth
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: (t) => `${t.col.border_light}90`,
              },
              "&:hover fieldset": {
                borderColor: (t) => t.col.border_light,
              },
              "&.Mui-focused fieldset": {
                borderColor: (t) => t.col.border_light,
              },
            },
          }}
        />

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
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
        </Box>
      </Box>
    </Box>
  );
}
