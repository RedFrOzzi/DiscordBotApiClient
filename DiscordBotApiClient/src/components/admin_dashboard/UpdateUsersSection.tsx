import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Typography,
  Avatar,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import CancelIcon from "@mui/icons-material/Cancel";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { discordApi } from "../../api/discordApi";
import { ApiError } from "../../api/ApiError";
import { useDiscordData } from "../../api/useDiscordData";

type Phase = "idle" | "running" | "done";

const PHASE_KEY = ["users-update-phase"] as const;
const PROGRESS_KEY = ["users-update-progress"] as const;
const PROGRESS_POLL_MS = 3000;

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 400:
        return "Некорректный запрос.";
      case 409:
        return "Обновление уже запущено.";
      case 500:
        return "Ошибка сервера. Попробуйте позже.";
      default:
        return `Ошибка ${err.status}. Попробуйте позже.`;
    }
  }
  if (err instanceof Error) return err.message;
  return "Не удалось выполнить операцию.";
}

function initials(name: string | null | undefined) {
  return name?.trim().slice(0, 2).toUpperCase() || "?";
}

export function UpdateUsersSection() {
  const { guilds } = useDiscordData();
  const queryClient = useQueryClient();

  const [guildId, setGuildId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: phase = "idle" } = useQuery<Phase>({
    queryKey: PHASE_KEY,
    queryFn: () => "idle",
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const setPhase = (p: Phase) => queryClient.setQueryData(PHASE_KEY, p);

  const startMutation = useMutation<void, Error, string>({
    mutationFn: discordApi.updateUsers,
    onSuccess: () => {
      setError(null);
      setSuccess(null);
      setPhase("running");
    },
    onError: (err) => {
      setError(errorMessage(err));
      setSuccess(null);
    },
  });

  // Poll progress
  // Returns a number 0-100 while running, or `null` when the server
  // reports 400 ("no update in progress").
  const progressQuery = useQuery<number | null>({
    queryKey: PROGRESS_KEY,
    queryFn: async () => {
      try {
        return await discordApi.getUpdateProgress();
      } catch (e) {
        if (e instanceof ApiError && e.status === 400) return null;
        throw e;
      }
    },
    enabled: phase === "running",
    retry: false,
    refetchInterval: (query) => {
      const d = query.state.data;
      return typeof d === "number" ? PROGRESS_POLL_MS : false;
    },
    gcTime: 5 * 60_000,
  });

  const progress =
    typeof progressQuery.data === "number" ? progressQuery.data : 0;

  // When the server reports "no update running" → transition to done.
  useEffect(() => {
    if (phase !== "running") return;
    if (progressQuery.data === null) {
      setPhase("done");
      setSuccess("Обновление завершено.");
    }
  }, [progressQuery.data, phase]);

  // Cancel
  const cancelMutation = useMutation<void, Error, void>({
    mutationFn: discordApi.cancelUpdate,
    onSuccess: () => {
      setPhase("done");
      setSuccess("Обновление отменено.");
      setError(null);
    },
    onError: (err) => setError(errorMessage(err)),
  });

  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [guildId]);

  const isRunning = phase === "running";
  const canStart = !!guildId && !isRunning && !startMutation.isPending;

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{ color: (t) => t.col.text, mb: 2, fontSize: "1.05rem" }}
      >
        Обновление данных пользователей
      </Typography>

      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <FormControl size="small" fullWidth disabled={isRunning}>
          <InputLabel id="update-users-guild-label">Канал</InputLabel>
          <Select
            labelId="update-users-guild-label"
            label="Канал"
            value={guildId}
            onChange={(e) => setGuildId(e.target.value)}
            renderValue={(selected) => {
              if (!selected) return "";
              const g = guilds.find((x) => x.id === selected);
              if (!g) return "";
              return (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar
                    src={g?.iconUrl || undefined}
                    variant="rounded"
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: "6px",
                      fontSize: 10,
                      fontWeight: 600,
                      bgcolor: (t) => t.col.bg_400,
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
                    borderColor: (t) => t.col.border_light,
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
                        bgcolor: (t) => t.col.bg_400,
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

        {isRunning && (
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 0.5,
              }}
            >
              <Typography variant="caption" sx={{ color: (t) => t.col.text }}>
                Прогресс
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontVariantNumeric: "tabular-nums",
                  color: (t) => t.col.text,
                }}
              >
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 1,
                bgcolor: "rgba(255,255,255,0.06)",
                "& .MuiLinearProgress-bar": {
                  bgcolor: (t) => t.col.details,
                },
              }}
            />
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
          }}
        >
          {isRunning ? (
            <Button
              variant="outlined"
              color="error"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              startIcon={
                cancelMutation.isPending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <CancelIcon />
                )
              }
              sx={{ textTransform: "none" }}
            >
              {cancelMutation.isPending ? "Отмена…" : "Отменить"}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => startMutation.mutate(guildId)}
              disabled={!canStart}
              startIcon={
                startMutation.isPending ? (
                  <CircularProgress size={16} />
                ) : (
                  <RefreshIcon />
                )
              }
            >
              {startMutation.isPending
                ? "Запуск…"
                : phase === "done"
                  ? "Запустить снова"
                  : "Запустить обновление"}
            </Button>
          )}
        </Box>
      </Stack>
    </Box>
  );
}
