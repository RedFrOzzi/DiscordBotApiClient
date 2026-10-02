import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useAudioExtract } from "../../api/useAudioExtract";
import type Timestamp from "../../models/Timestamp";
import { YouTube } from "@mui/icons-material";

//  Time-input helper (HH / MM / SS only)
type TimeParts = { hours: number; minutes: number; seconds: number };
const EMPTY_TIME: TimeParts = { hours: 0, minutes: 0, seconds: 0 };
const timeToSeconds = (t: TimeParts) =>
  t.hours * 3600 + t.minutes * 60 + t.seconds;

interface TimeInputsProps {
  label: string;
  value: TimeParts;
  onChange: (v: TimeParts) => void;
  disabled?: boolean;
}

//Time Input Component
function TimeInputs({ label, value, onChange, disabled }: TimeInputsProps) {
  const handle =
    (field: keyof TimeParts) => (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const parsed = raw === "" ? 0 : Number(raw);
      if (Number.isNaN(parsed)) return;
      onChange({ ...value, [field]: Math.max(0, parsed) });
    };

  return (
    <Stack spacing={0.5}>
      <Typography variant="caption">{label}</Typography>
      <Stack direction="row" spacing={0.5}>
        <TextField
          label="Часы"
          type="number"
          size="small"
          value={value.hours}
          onChange={handle("hours")}
          disabled={disabled}
          slotProps={{ htmlInput: { min: 0 } }}
          sx={{ width: 80 }}
        />
        <TextField
          label="Минуты"
          type="number"
          size="small"
          value={value.minutes}
          onChange={handle("minutes")}
          disabled={disabled}
          slotProps={{ htmlInput: { min: 0 } }}
          sx={{ width: 80 }}
        />
        <TextField
          label="Секунды"
          type="number"
          size="small"
          value={value.seconds}
          onChange={handle("seconds")}
          disabled={disabled}
          slotProps={{ htmlInput: { min: 0 } }}
          sx={{ width: 80 }}
        />
      </Stack>
    </Stack>
  );
}

export interface AudioExtractionFormProps {
  onSuccess?: (fileUrl: string, operationId: string) => void;
  onError?: (error: string) => void;
  pollIntervalMs?: number;
}

export function AudioExtractionForm({
  onSuccess,
  onError,
  pollIntervalMs,
}: AudioExtractionFormProps) {
  const [ytUrl, setYtUrl] = useState("");
  const [extractStart, setExtractStart] = useState<TimeParts>(EMPTY_TIME);
  const [extractEnd, setExtractEnd] = useState<TimeParts>(EMPTY_TIME);
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    submit,
    isWorking,
    isPolling,
    finalStatus,
    downloadUrl,
    operationId,
    isSubmitError,
    submitError,
  } = useAudioExtract({ pollIntervalMs });

  const theme = useTheme();

  // Latest onSuccess, without re-firing on every parent render
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const reportedUrlRef = useRef<string | null>(null);
  const reportedErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (downloadUrl && operationId && reportedUrlRef.current !== downloadUrl) {
      reportedUrlRef.current = downloadUrl;
      onSuccessRef.current?.(downloadUrl, operationId);
    }
  }, [downloadUrl, operationId]);

  const isFailed = finalStatus?.status === "failed";

  const serverErrorText = isSubmitError
    ? (submitError?.message ?? "Не удалось отправить запрос.")
    : isFailed
      ? finalStatus?.resultMessage || "Извлечение не удалось."
      : null;

  useEffect(() => {
    if (serverErrorText && reportedErrorRef.current !== serverErrorText) {
      reportedErrorRef.current = serverErrorText;
      onErrorRef.current?.(serverErrorText);
    }
    if (!serverErrorText) {
      reportedErrorRef.current = null;
    }
  }, [serverErrorText]);

  const handleExtract = () => {
    setValidationError(null);

    if (!ytUrl.trim()) {
      setValidationError("Введите ссылку на YouTube.");
      return;
    }
    if (timeToSeconds(extractEnd) <= timeToSeconds(extractStart)) {
      setValidationError("Время конца должно быть больше времени начала.");
      return;
    }

    const startsAt: Timestamp = {
      ...extractStart,
      miliseconds: 0,
      isTillTheEnd: false,
    };
    const endsAt: Timestamp = {
      ...extractEnd,
      miliseconds: 0,
      isTillTheEnd: false,
    };

    submit({ url: ytUrl.trim(), startsAt, endsAt });
  };

  return (
    <Box
      sx={{
        maxWidth: 720,
        mx: "auto",
        mt: 2,
        p: 2,
        border: `1px solid ${theme.col.details}`,
        borderRadius: 2,
        background: `linear-gradient(180deg, ${theme.col.bg_global_light} 0%, ${theme.col.bg_global_dark} 100%)`,
      }}
    >
      <Stack>
        <Stack spacing={2} sx={{ textAlign: "center" }}>
          <Typography variant="h6">Извлечение аудио из YouTube</Typography>

          <TextField
            label="YouTube URL"
            placeholder="https://www.youtube.com/watch?v=..."
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            disabled={isWorking}
            fullWidth
            required
            variant="outlined"
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <YouTube />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={5}
          sx={{ mt: 1, justifyContent: "space-around" }}
        >
          <TimeInputs
            label="Начало"
            value={extractStart}
            onChange={setExtractStart}
            disabled={isWorking}
          />
          <TimeInputs
            label="Конец"
            value={extractEnd}
            onChange={setExtractEnd}
            disabled={isWorking}
          />
        </Stack>

        <Stack
          direction="column"
          spacing={2}
          sx={{ mt: 2.5, alignItems: "center" }}
        >
          <Button
            variant="contained"
            onClick={handleExtract}
            disabled={isWorking}
            startIcon={
              isWorking ? <CircularProgress size={18} color="inherit" /> : null
            }
          >
            {isWorking ? "Извлечение…" : "Начать извлечение"}
          </Button>

          {isPolling && (
            <Typography variant="body2" color="text.secondary">
              Обработка на сервере…
            </Typography>
          )}
        </Stack>

        {validationError && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {validationError}
          </Alert>
        )}
      </Stack>
    </Box>
  );
}

export default AudioExtractionForm;
