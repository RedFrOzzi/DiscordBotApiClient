import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Avatar,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useMutation } from "@tanstack/react-query";
import { discordApi } from "../../api/discordApi";
import { ApiError } from "../../api/ApiError";
import { useDiscordData } from "../../api/useDiscordData";

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 400:
        return "Некорректный идентификатор гильдии.";
      case 409:
        return "Обновление уже запущено.";
      default:
        return `Ошибка ${err.status}. Попробуйте позже.`;
    }
  }
  if (err instanceof Error) return err.message;
  return "Не удалось запустить обновление.";
}

function initials(name: string | null | undefined) {
  return name?.trim().slice(0, 2).toUpperCase() || "?";
}

export function UpdateGuildDataSection() {
  const { guilds } = useDiscordData();
  const [guildId, setGuildId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mutation = useMutation<void, Error, string>({
    mutationFn: discordApi.updateGuildData,
    onSuccess: (_data, vars) => {
      const g = guilds.find((x) => x.id === vars);
      setSuccess(`Обновление гильдии «${g?.name ?? vars}» запущено.`);
      setError(null);
    },
    onError: (err) => {
      setError(errorMessage(err));
      setSuccess(null);
    },
  });

  const handleSubmit = () => {
    setError(null);
    setSuccess(null);
    if (!guildId) return;
    mutation.mutate(guildId);
  };

  const canSubmit = !!guildId && !mutation.isPending;

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{ color: (t) => t.col.text, mb: 2, fontSize: "1.05rem" }}
      >
        Запустить обновление данных канала
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <FormControl size="small" fullWidth disabled={mutation.isPending}>
          <InputLabel id="update-guild-label">Канал</InputLabel>
          <Select
            labelId="update-guild-label"
            label="Канал"
            value={guildId}
            onChange={(e) => {
              setGuildId(e.target.value);
              setError(null);
              setSuccess(null);
            }}
            renderValue={(selected) => {
              if (!selected) return "";
              const g = guilds.find((x) => x.id === selected);
              const icon = g?.iconUrl || undefined;
              if (!g) return "";
              return (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar
                    src={icon}
                    variant="rounded"
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: "6px",
                      fontSize: 10,
                      fontWeight: 600,
                      bgcolor: (t) => t.col.bg_500,
                      color: (t) => t.col.text,
                    }}
                  >
                    {initials(g.name)}
                  </Avatar>
                  <span>{g.name ?? "—"}</span>
                </Box>
              );
            }}
            sx={{
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: (t) => `${t.col.border_light}90`,
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: (t) => t.col.border_light,
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: (t) => t.col.border_light,
              },
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
            {guilds.map((g) => {
              if (!g.id) return null;
              return (
                <MenuItem key={g.id} value={g.id}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar
                      src={g?.iconUrl || undefined}
                      variant="rounded"
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: "6px",
                        fontSize: 11,
                        fontWeight: 600,
                        bgcolor: (t) => t.col.bg_600,
                        color: (t) => t.col.text,
                      }}
                    >
                      {initials(g.name)}
                    </Avatar>
                    <span>{g.name ?? "—"}</span>
                  </Box>
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!canSubmit}
            startIcon={
              mutation.isPending ? (
                <CircularProgress size={16} />
              ) : (
                <RefreshIcon />
              )
            }
          >
            {mutation.isPending ? "Запуск…" : "Запустить обновление"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
