import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { discordApi } from "../../../api/discordApi";
import { ApiError } from "../../../api/ApiError";
import {
  TTS_DEFAULTS,
  TTS_VOICES,
  TTS_VOICES_SHORT,
  type TTSVoice,
} from "./ttsVoices";
import { StopCircle } from "@mui/icons-material";

const ERROR_KEY_MAP: Record<string, string> = {
  message: "Введите текст сообщения.",
  guild: "Не удалось определить гильдию.",
  bot: "Бот не находится в голосовом канале.",
};

const STOP_ERROR_KEY_MAP: Record<string, string> = {
  guild: "Не удалось определить гильдию.",
  bot: "Бот не находится в голосовом канале этой гильдии.",
  stream: "Сейчас ничего не воспроизводится в этой гильдии.",
};

function parseStreamVoiceError(err: unknown): string {
  if (err instanceof ApiError) {
    try {
      const parsed = JSON.parse(err.body) as { key?: string; message?: string };
      if (parsed.key && ERROR_KEY_MAP[parsed.key]) {
        return ERROR_KEY_MAP[parsed.key];
      }
      if (parsed.message) return parsed.message;
    } catch {}

    switch (err.status) {
      case 400:
        return "Проверьте текст и параметры.";
      case 401:
        return "Требуется авторизация.";
      case 500:
        return "Ошибка сервера. Попробуйте позже.";
      default:
        return `Ошибка ${err.status}. Попробуйте позже.`;
    }
  }
  if (err instanceof Error) return err.message;
  return "Не удалось отправить.";
}

function parseStopError(err: unknown): string {
  if (err instanceof ApiError) {
    try {
      const parsed = JSON.parse(err.body) as {
        key?: string;
        message?: string;
        error?: string;
      };
      if (parsed.key && STOP_ERROR_KEY_MAP[parsed.key]) {
        return STOP_ERROR_KEY_MAP[parsed.key];
      }
      if (parsed.error) return parsed.error;
      if (parsed.message) return parsed.message;
    } catch {}

    switch (err.status) {
      case 400:
        return "Некорректный запрос.";
      case 404:
        return "Не удалось остановить воспроизведение.";
      case 500:
        return "Ошибка сервера. Попробуйте позже.";
      default:
        return `Ошибка ${err.status}. Попробуйте позже.`;
    }
  }
  if (err instanceof Error) return err.message;
  return "Не удалось остановить воспроизведение.";
}

type Props = {
  guildId: string;
};

function formatSigned(value: number, suffix: string): string {
  return value >= 0 ? `+${value}${suffix}` : `${value}${suffix}`;
}

export function StreamVoiceComposer({ guildId }: Props) {
  const [message, setMessage] = useState("");
  const [voice, setVoice] = useState<string>(TTS_DEFAULTS.voice);
  const [pitch, setPitch] = useState<number>(TTS_DEFAULTS.pitch);
  const [rate, setRate] = useState<number>(TTS_DEFAULTS.rate);
  const [volume, setVolume] = useState<number>(TTS_DEFAULTS.volume);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [shortTTSList, setShortTTSList] = useState<boolean>(true);

  const mutation = useMutation<void, Error, void>({
    mutationFn: () =>
      discordApi.streamVoice({
        guildId,
        message: message.trim(),
        options: {
          voice,
          pitch: formatSigned(pitch, "Hz"),
          rate: formatSigned(rate, "%"),
          volume: formatSigned(volume, "%"),
        },
      }),
    onSuccess: () => {
      setFeedback({ kind: "success", text: "Отправлено в голосовой канал." });
      setMessage("");
    },
    onError: (err) => {
      setFeedback({ kind: "error", text: parseStreamVoiceError(err) });
    },
  });

  const stopMutation = useMutation<void, Error, void>({
    mutationFn: () => discordApi.stopVoiceStream(guildId),
    onSuccess: () => {
      setFeedback({ kind: "success", text: "Воспроизведение остановлено." });
    },
    onError: (err) => {
      setFeedback({ kind: "error", text: parseStopError(err) });
    },
  });

  // Auto-dismiss feedback after 3s
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(t);
  }, [feedback]);

  useEffect(() => {
    setVoice(TTS_DEFAULTS.voice);
  }, [shortTTSList]);

  const handleSend = () => {
    setFeedback(null);
    mutation.mutate();
  };

  const handleTTSVoicesListChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setShortTTSList(event.target.checked);
  };

  const canSend = message.trim().length > 0 && !mutation.isPending;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        height: "100%",
        minHeight: 0,
      }}
    >
      {/* Header */}
      <Box sx={{ ml: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <RecordVoiceOverIcon sx={{ color: (t) => t.col.text }} />
        <Typography
          variant="subtitle1"
          sx={{ color: "app.text", fontWeight: 600 }}
        >
          Голосовое сообщение (TTS)
        </Typography>
      </Box>

      <Divider sx={{ borderColor: (t) => t.col.border_light }} />

      {/* Text area */}
      <TextField
        placeholder="Введите текст, который бот озвучит…"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          setFeedback(null);
        }}
        multiline
        minRows={4}
        fullWidth
        disabled={mutation.isPending}
        sx={{
          ml: 2,
          pr: 2,
          minHeight: 120,
          flex: 1,
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: (t) => `${t.col.border_light}80`,
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

      {/* Voice select */}
      <FormControlLabel
        label="Короткий список голосов"
        control={
          <Switch
            defaultChecked
            size="small"
            onChange={handleTTSVoicesListChange}
            sx={{ ml: 3.5, mr: 2 }}
          />
        }
      />
      <TTSVoiceSelector
        mutation={mutation}
        setVoice={setVoice}
        voice={voice}
        tts_voices={shortTTSList ? TTS_VOICES_SHORT : TTS_VOICES}
      />

      {/* Sliders */}
      <Stack
        direction={"row"}
        spacing={4}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ml: 2,
        }}
      >
        <SliderRow
          width={150}
          label="Тон"
          value={pitch}
          min={-100}
          max={100}
          step={1}
          display={formatSigned(pitch, "Hz")}
          onChange={setPitch}
          disabled={mutation.isPending}
        />
        <SliderRow
          width={150}
          label="Скорость"
          value={rate}
          min={-100}
          max={100}
          step={5}
          display={formatSigned(rate, "%")}
          onChange={setRate}
          disabled={mutation.isPending}
        />
        <SliderRow
          width={150}
          label="Громкость"
          value={volume}
          min={0}
          max={200}
          step={5}
          display={formatSigned(volume, "%")}
          onChange={setVolume}
          disabled={mutation.isPending}
        />
      </Stack>

      {feedback && <Alert severity={feedback.kind}>{feedback.text}</Alert>}

      <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 1 }}>
        <Button
          variant="outlined"
          color="error"
          onClick={() => {
            setFeedback(null);
            stopMutation.mutate();
          }}
          disabled={stopMutation.isPending}
          startIcon={
            stopMutation.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <StopCircle />
            )
          }
          sx={{ textTransform: "none" }}
        >
          {stopMutation.isPending ? "Остановка…" : "Остановить"}
        </Button>

        <Button
          variant="contained"
          onClick={handleSend}
          disabled={!canSend}
          startIcon={
            mutation.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <SendIcon />
            )
          }
        >
          {mutation.isPending ? "Отправка…" : "Отправить"}
        </Button>
      </Box>
    </Box>
  );
}

function TTSVoiceSelector({
  mutation,
  voice,
  setVoice,
  tts_voices,
}: {
  mutation: UseMutationResult<void, Error, void, unknown>;
  voice: string;
  setVoice: (value: React.SetStateAction<string>) => void;
  tts_voices: TTSVoice[];
}) {
  return (
    <FormControl
      size="small"
      fullWidth
      disabled={mutation.isPending}
      sx={{ ml: 2, pr: 2 }}
    >
      <InputLabel id="tts-voice-label">Голос</InputLabel>
      <Select
        labelId="tts-voice-label"
        label="Голос"
        value={voice}
        onChange={(e) => setVoice(e.target.value)}
        sx={{
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: (t) => t.col.border_light,
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
                bgcolor: (t) => t.col.bg_300,
                backgroundImage: "none",
                border: "1px solid",
                borderColor: (t) => t.col.border_light,
                maxHeight: 320,
              },
            },
          },
        }}
      >
        {tts_voices.map((v) => (
          <MenuItem key={v.id} value={v.id}>
            {`${v.label} [ ${v.locale} ]`}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function QuickSetButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      size="small"
      variant="outlined"
      onClick={onClick}
      disabled={disabled}
      sx={{
        minWidth: 0,
        px: 1,
        py: 0,
        fontSize: 13,
        lineHeight: 1.2,
        color: (t) => t.col.text,
        backgroundColor: (t) => t.col.bg_600,
        borderColor: (t) => t.col.border_light,
        textTransform: "none",
        fontVariantNumeric: "tabular-nums",
        "&:hover": {
          color: (t) => t.col.text,
          bgcolor: (t) => t.col.bg_800,
        },
      }}
    >
      {label}
    </Button>
  );
}

function SliderRow({
  width,
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
  disabled,
}: {
  width: number;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const mid = Math.round((min + max) / 2);

  return (
    <Box sx={{ width: { width } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontVariantNumeric: "tabular-nums" }}
        >
          {display}
        </Typography>
      </Box>
      <Slider
        size="small"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(_e, v) => onChange(v as number)}
        disabled={disabled}
        sx={{
          color: (t) => t.col.text,
          "& .MuiSlider-thumb": { width: 14, height: 14 },
        }}
      />

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mt: -0.5,
        }}
      >
        <QuickSetButton
          label={String(min)}
          onClick={() => onChange(min)}
          disabled={disabled}
        />
        <QuickSetButton
          label={String(mid)}
          onClick={() => onChange(mid)}
          disabled={disabled}
        />
        <QuickSetButton
          label={String(max)}
          onClick={() => onChange(max)}
          disabled={disabled}
        />
      </Box>
    </Box>
  );
}
