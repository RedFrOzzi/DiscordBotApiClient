import type AudioExtractionPostQueryDto from "../models/AudioExtractionPostQueryDto";
import type AudioExtractionGetFileQueryDto from "../models/AudioExtractionGetFileQueryDto";
import type { AudioEditorOperationStatusDto } from "../models/AudioEditorOperationStatusDto";

export async function submitAudioExtractorData(
  config: AudioExtractionPostQueryDto,
): Promise<AudioExtractionGetFileQueryDto> {
  const postURL = `${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_API_EXTRACT_AUDIO_URL}`;
  const response = await fetch(postURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  if (response.status !== 202) {
    const message = await response.text();
    throw new Error(message || `Request rejected (${response.status})`);
  }

  return response.json() as Promise<AudioExtractionGetFileQueryDto>;
}

export async function fetchOperationStatus(
  statusUrl: string,
  operationId: string,
): Promise<AudioEditorOperationStatusDto> {
  const url = new URL(statusUrl);
  url.searchParams.set("operationId", operationId);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Status check failed: ${res.status}`);
  }
  return res.json() as Promise<AudioEditorOperationStatusDto>;
}

export interface UploadAudioPayload {
  operationId: string;
  guildId: string;
  title: string;
  startsAt: {
    hours: number;
    minutes: number;
    seconds: number;
    miliseconds: number;
    isTillTheEnd: boolean;
  };
  endsAt: {
    hours: number;
    minutes: number;
    seconds: number;
    miliseconds: number;
    isTillTheEnd: boolean;
  };
}

export async function uploadExtractedAudio(
  payload: UploadAudioPayload,
): Promise<void> {
  const url = `${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_API_UPLOAD_AUDIO_URL}`;

  const form = new FormData();
  form.append("OperationId", payload.operationId);
  form.append("GuildId", payload.guildId);
  form.append("Title", payload.title);
  console.log(payload.startsAt);
  console.log(payload.endsAt);
  form.append("StartsAt.Hours", String(payload.startsAt.hours));
  form.append("StartsAt.Minutes", String(payload.startsAt.minutes));
  form.append("StartsAt.Seconds", String(payload.startsAt.seconds));
  form.append("StartsAt.Miliseconds", String(payload.startsAt.miliseconds));
  form.append("StartsAt.IsTillTheEnd", String(payload.startsAt.isTillTheEnd));

  form.append("EndsAt.Hours", String(payload.endsAt.hours));
  form.append("EndsAt.Minutes", String(payload.endsAt.minutes));
  form.append("EndsAt.Seconds", String(payload.endsAt.seconds));
  form.append("EndsAt.Miliseconds", String(payload.endsAt.miliseconds));
  form.append("EndsAt.IsTillTheEnd", String(payload.endsAt.isTillTheEnd));

  const res = await fetch(url, {
    method: "POST",
    body: form,
    // headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Upload failed (${res.status})`);
  }
}
