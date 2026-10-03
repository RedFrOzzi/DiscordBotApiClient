import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useWavesurfer } from "@wavesurfer/react";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import HoverPlugin from "wavesurfer.js/dist/plugins/hover.esm.js";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.esm.js";
import ZoomPlugin from "wavesurfer.js/dist/plugins/zoom.esm.js";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Slider from "@mui/material/Slider";
import VolumeDown from "@mui/icons-material/VolumeDown";
import VolumeUp from "@mui/icons-material/VolumeUp";
import {
  Box,
  CircularProgress,
  Container,
  Typography,
  useTheme,
} from "@mui/material";
import {
  CancelPresentation,
  Expand,
  Pause,
  PlayArrow,
  Stop,
  VerticalAlignBottom,
} from "@mui/icons-material";
import {
  ConvertAudioSection,
  type SectionTimestamp,
} from "../../utils/AudioSectionToTimestamps";
import { TextField } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useMutation } from "@tanstack/react-query";
import {
  uploadExtractedAudio,
  type UploadAudioPayload,
} from "../../api/audioExtractionQuerys";
import { tokenStore } from "../../auth/tokenStore";

const marks = [
  { value: 0 },
  { value: 0.25 },
  { value: 0.5 },
  { value: 0.75 },
  { value: 1 },
];

const waveformMainColor = "#06D6A0";
const waveformPlayedColor = "#047456";
const regionColor = "#fd003b73";
const regionPlayingColor = "#fd003b9b";
const cursorColor = "#f1ebec";
const cursorMouseColor = "#040cff";
const textColor = "#cccccc";

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${m}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
};

interface AudioWaveformEditorProps {
  url: string;
  operationId: string;
  tabName: string;
  onUploaded?: () => void;
}

function AudioWaveformEditor({
  url,
  operationId,
  tabName,
  onUploaded,
}: AudioWaveformEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [sectionTimestamp, setSectionTimestamp] = useState<SectionTimestamp>(
    () => ConvertAudioSection({ start: 0, end: 0 }),
  );
  const [isReady, setIsReady] = useState(false);
  const [hasRegion, setHasRegion] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [guildId, setGuildId] = useState("");
  const [title, setTitle] = useState("");

  const theme = useTheme();

  const regionsPlugin = useMemo(() => RegionsPlugin.create(), []);

  const onUploadedRef = useRef(onUploaded);
  useEffect(() => {
    onUploadedRef.current = onUploaded;
  }, [onUploaded]);

  const zoomPlugin = useMemo(
    () =>
      ZoomPlugin.create({
        scale: 0.7,
        maxZoom: 10000,
        exponentialZooming: true,
        iterations: 50,
      }),
    [],
  );

  const hoverPlugin = HoverPlugin.create({
    formatTimeCallback: formatTime,
    lineColor: cursorMouseColor,
    labelColor: textColor,
    labelSize: 14,
  });

  const timelinePlugin = TimelinePlugin.create({
    height: 24,
    timeInterval: 0.2,
    primaryLabelInterval: 1,
    secondaryLabelOpacity: 0.5,
    style: { color: textColor },
    formatTimeCallback: (seconds) => {
      const totalSec = Math.round(seconds);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    },
  });

  const plugins = useMemo(
    () => [regionsPlugin, hoverPlugin, timelinePlugin, zoomPlugin],
    [regionsPlugin, hoverPlugin, timelinePlugin, zoomPlugin],
  );

  const token = tokenStore.get();

  const { wavesurfer, isReady: hookIsReady } = useWavesurfer({
    container: containerRef,
    height: 200,
    barHeight: 4,
    barGap: 0,
    barRadius: 0,
    barWidth: 0,
    waveColor: waveformMainColor,
    progressColor: waveformPlayedColor,
    cursorColor,
    url,
    plugins,
    fetchParams: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });

  useEffect(() => {
    if (!wavesurfer || !hookIsReady || tabName === "audio") return;
    if (isPlaying) wavesurfer.pause();
  }, [wavesurfer, hookIsReady, tabName, isPlaying]);

  useEffect(() => {
    if (!wavesurfer || !hookIsReady) return;
    wavesurfer.setVolume(volume);
  }, [volume, wavesurfer, hookIsReady]);

  useEffect(() => {
    if (hookIsReady) setIsReady(true);
  }, [hookIsReady]);

  useEffect(() => {
    if (!regionsPlugin || !hookIsReady) return;

    regionsPlugin.enableDragSelection({ color: regionColor });

    const unsubCreated = regionsPlugin.on("region-created", (region: any) => {
      const allRegions = regionsPlugin.getRegions();
      if (allRegions.length > 1) {
        region.remove();
        return;
      }
      setHasRegion(true);
      setSelection({ start: region.start, end: region.end });
    });

    const unsubUpdated = regionsPlugin.on("region-updated", (region: any) => {
      setSelection({ start: region.start, end: region.end });
    });

    const unsubRemoved = regionsPlugin.on("region-removed", () => {
      if (regionsPlugin.getRegions().length === 0) {
        setHasRegion(false);
        setSelection({ start: 0, end: 0 });
      }
    });

    return () => {
      unsubCreated?.();
      unsubUpdated?.();
      unsubRemoved?.();
    };
  }, [regionsPlugin, hookIsReady]);

  useEffect(() => {
    if (!wavesurfer) return;
    const unsubPlay = wavesurfer.on("play", () => setIsPlaying(true));
    const unsubPause = wavesurfer.on("pause", () => setIsPlaying(false));
    const unsubFinish = wavesurfer.on("finish", () => setIsPlaying(false));
    return () => {
      unsubPlay?.();
      unsubPause?.();
      unsubFinish?.();
    };
  }, [wavesurfer]);

  useEffect(() => {
    setSectionTimestamp(ConvertAudioSection(selection));
  }, [selection]);

  const addRegion = () => {
    if (!regionsPlugin || !isReady || !wavesurfer) return;
    if (regionsPlugin.getRegions().length > 0) return;
    if (!wavesurfer.getDuration()) return;

    const halfTime = wavesurfer.getDuration() / 2;
    const startRegionTime = halfTime / 2;
    const endRegionTime = startRegionTime + halfTime;

    regionsPlugin.addRegion({
      start: startRegionTime,
      end: endRegionTime,
      color: regionColor,
      drag: true,
      resize: true,
    });
  };

  const clearRegion = () => {
    if (!regionsPlugin) return;
    regionsPlugin.getRegions().forEach((r: any) => r.remove());
    setHasRegion(false);
    setSelection({ start: 0, end: 0 });
  };

  const toRegionBeginning = () => {
    if (!regionsPlugin || !wavesurfer || !hasRegion) return;
    wavesurfer.pause();
    wavesurfer.setTime(selection.start);
  };

  const playAll = useCallback(() => {
    if (!wavesurfer) return;
    if (isPlaying) wavesurfer.pause();
    else wavesurfer.play();
  }, [wavesurfer, isPlaying]);

  const playRegion = useCallback(() => {
    if (!wavesurfer || !hasRegion) return;
    const region = regionsPlugin.getRegions()[0];
    if (!region) return;

    region.setOptions({ color: regionPlayingColor });
    wavesurfer.play(region.start, region.end);

    const checkEnd = () => {
      if (wavesurfer.getCurrentTime() >= region.end) {
        wavesurfer.pause();
        region.setOptions({ color: regionColor });
        wavesurfer.un("audioprocess", checkEnd);
      }
    };
    wavesurfer.on("audioprocess", checkEnd);
  }, [wavesurfer, regionsPlugin, hasRegion]);

  const restart = useCallback(() => {
    if (!wavesurfer) return;
    wavesurfer.stop();
  }, [wavesurfer]);

  //Upload Audio Track handlers
  const uploadMutation = useMutation<void, Error, UploadAudioPayload>({
    mutationFn: uploadExtractedAudio,
    onSuccess: () => {
      onUploadedRef.current?.();
    },
  });

  const handleUpload = useCallback(() => {
    if (!hasRegion) return;
    if (!guildId.trim() || Number.isNaN(Number(guildId))) return;
    if (!title.trim()) return;

    uploadMutation.mutate({
      operationId,
      guildId: guildId.trim(),
      title: title.trim(),
      startsAt: {
        hours: sectionTimestamp.startHours,
        minutes: sectionTimestamp.startMinutes,
        seconds: sectionTimestamp.startSeconds,
        miliseconds: sectionTimestamp.startMiliseconds,
        isTillTheEnd: false,
      },
      endsAt: {
        hours: sectionTimestamp.endHours,
        minutes: sectionTimestamp.endMinutes,
        seconds: sectionTimestamp.endSeconds,
        miliseconds: sectionTimestamp.endMiliseconds,
        isTillTheEnd: false,
      },
    });
  }, [
    hasRegion,
    guildId,
    title,
    sectionTimestamp,
    operationId,
    uploadMutation,
  ]);

  const isUploading = uploadMutation.isPending;

  useEffect(() => {
    if (!uploadMutation.isSuccess) return;
    const t = setTimeout(() => uploadMutation.reset(), 3000);
    return () => clearTimeout(t);
  }, [uploadMutation]);

  return (
    <>
      <Container sx={{ mt: 5, mb: 2, textAlign: "center" }}>
        <Typography
          variant="h6"
          sx={{ textAlign: "center", fontVariantNumeric: "tabular-nums" }}
        >
          Выделено: {formatTime(selection.start)} - {formatTime(selection.end)}
        </Typography>
      </Container>

      <div
        ref={containerRef}
        style={{
          marginLeft: 20,
          marginRight: 20,
          border: `1px solid ${waveformMainColor}`,
          overflow: "hidden",
          backgroundColor: "var(--audio-bg)",
          borderRadius: 6,
        }}
      />

      <Stack
        spacing={2}
        direction="row"
        sx={{ alignItems: "center", justifyContent: "center", mb: 2, mt: 2 }}
      >
        <VolumeDown />
        <Slider
          aria-label="Volume"
          size="small"
          marks={marks}
          min={0}
          max={1}
          step={0.01}
          shiftStep={0.1}
          value={volume}
          onChange={(_e, val) => setVolume(val as number)}
          disabled={!isReady}
          sx={{ width: "150px" }}
        />
        <VolumeUp />
        <Typography
          variant="body1"
          sx={{
            width: "3.5em",
            textAlign: "left",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {Math.round(volume * 100)}%
        </Typography>
      </Stack>

      <Stack
        direction="row"
        spacing={2}
        sx={{ marginTop: "1lh", marginBottom: "1lh", justifyContent: "center" }}
      >
        <Button
          variant="contained"
          onClick={playAll}
          disabled={!isReady}
          startIcon={isPlaying ? <Pause /> : <PlayArrow />}
          sx={{ minWidth: "14ch", pl: 0, pr: 0 }}
        >
          {isPlaying ? "Пауза" : "Играть"}
        </Button>

        <Button
          variant="contained"
          onClick={restart}
          disabled={!isReady}
          startIcon={<Stop />}
          sx={{ minWidth: "14ch", pl: 0, pr: 0 }}
        >
          Стоп
        </Button>

        <Button
          variant="contained"
          onClick={playRegion}
          disabled={!isReady || !hasRegion}
          startIcon={<PlayArrow />}
        >
          Играть выделенное
        </Button>

        <Button
          variant="contained"
          onClick={toRegionBeginning}
          disabled={!hasRegion}
          startIcon={
            <VerticalAlignBottom sx={{ transform: "rotate(90deg)" }} />
          }
        >
          В начало фрагмента
        </Button>

        <Button
          variant="contained"
          onClick={addRegion}
          disabled={!isReady || hasRegion}
          startIcon={<Expand sx={{ transform: "rotate(90deg)" }} />}
        >
          Выделить
        </Button>

        <Button
          variant="contained"
          onClick={clearRegion}
          disabled={!hasRegion}
          startIcon={<CancelPresentation />}
        >
          Убрать выделение
        </Button>
      </Stack>
      <Box
        sx={{
          maxWidth: 520,
          mx: "auto",
          mt: 3,
          p: 2.5,
          border: `1px solid ${waveformMainColor}`,
          borderRadius: 2,
          background: `linear-gradient(180deg, ${theme.col.bg_global_light} 0%, ${theme.col.bg_global_dark} 100%)`,
        }}
      >
        <Stack spacing={2} sx={{ textAlign: "center" }}>
          <Typography variant="subtitle2" color="text.secondary">
            Сохранить выделенный фрагмент
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="ID Канала"
              value={guildId}
              onChange={(e) => setGuildId(e.target.value.replace(/\D/g, ""))}
              disabled={isUploading}
              size="small"
              fullWidth
            />
            <TextField
              label="Название"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { maxLength: 79 } }}
            />
          </Stack>

          <Stack direction="column" spacing={2} sx={{ alignItems: "center" }}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={isUploading || !hasRegion}
              startIcon={
                isUploading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <CloudUploadIcon />
                )
              }
            >
              {isUploading ? "Сохранение…" : "Сохранить"}
            </Button>

            {!hasRegion && (
              <Typography
                variant="caption"
                color="text.secondary"
                align="center"
              >
                Выделите фрагмент на волне, чтобы сохранить его.
              </Typography>
            )}
          </Stack>
        </Stack>
      </Box>
    </>
  );
}

export default AudioWaveformEditor;
