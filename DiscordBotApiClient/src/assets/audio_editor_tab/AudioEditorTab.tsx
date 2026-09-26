import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useWavesurfer } from "@wavesurfer/react";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import HoverPlugin from "wavesurfer.js/dist/plugins/hover.esm.js";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.esm.js";
import ZoomPlugin from "wavesurfer.js/dist/plugins/zoom.esm.js";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import VolumeDown from "@mui/icons-material/VolumeDown";
import VolumeUp from "@mui/icons-material/VolumeUp";
import Slider from "@mui/material/Slider";
import { Container, Typography } from "@mui/material";
import {
  CancelPresentation,
  Expand,
  Pause,
  PlayArrow,
  Stop,
} from "@mui/icons-material";

const waveformMainColor: string = "#06D6A0";
const waveformPlayedColor: string = "#047456";
// const regionColor2: string = "#ffd16650";
const regionColor: string = "#ef476e50";
const regionPlayingColor: string = "#ef476e80";
const cursorColor: string = "#930811";
const cursorMouseColor: string = "#eb4651";
const textColor: string = "#cccccc";

// const brakeToTimeParts = (totalSeconds: number) => {
//   const totalMs = Math.round(totalSeconds * 1000);
//   const hours = Math.floor(totalMs / 3_600_000);
//   const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
//   const seconds = Math.floor((totalMs % 60_000) / 1000);
//   const miliseconds = totalMs % 1000;
//   return { hours, minutes, seconds, miliseconds };
// };

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${m}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
};

function AudioEditorTab() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [isReady, setIsReady] = useState(false);
  const [hasRegion, setHasRegion] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);

  const regionsPlugin = useMemo(() => RegionsPlugin.create(), []);

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

  const { wavesurfer, isReady: hookIsReady } = useWavesurfer({
    container: containerRef,
    height: 200,
    barHeight: 4,
    barGap: 0,
    barRadius: 0,
    barWidth: 0,
    waveColor: waveformMainColor,
    progressColor: waveformPlayedColor,
    cursorColor: cursorColor,
    url: "/kisi.mp3",
    plugins,
  });

  useEffect(() => {
    if (!wavesurfer || !hookIsReady) return;
    wavesurfer.setVolume(volume);
  }, [volume, wavesurfer, hookIsReady]);

  useEffect(() => {
    if (hookIsReady) setIsReady(true);
  }, [hookIsReady]);

  useEffect(() => {
    if (!regionsPlugin || !hookIsReady) return;

    regionsPlugin.enableDragSelection({
      color: regionColor,
    });

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

  const playAll = useCallback(() => {
    if (!wavesurfer) return;
    if (isPlaying) {
      wavesurfer.pause();
    } else {
      wavesurfer.play();
    }
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

  return (
    <Box>
      <Container sx={{ mt: 5, mb: 2, textAlign: "center" }}>
        <Typography
          variant="h6"
          sx={{
            textAlign: "center",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          Выделено: {formatTime(selection.start)} - {formatTime(selection.end)}
        </Typography>
      </Container>
      <div
        ref={containerRef}
        style={{
          overflow: "hidden",
          backgroundColor: "var(--audio-bg)",
          borderRadius: 4,
        }}
      />
      <Stack
        spacing={2}
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "center",
          mb: 2,
          mt: 2,
        }}
      >
        <VolumeDown />
        <Slider
          aria-label="Volume"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(_e, val) => setVolume(val)}
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
        direction={"row"}
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
    </Box>
  );
}

export default AudioEditorTab;
