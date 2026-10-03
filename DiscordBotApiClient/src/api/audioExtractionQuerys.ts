import type AudioExtractionPostQueryDto from "../models/AudioExtractionPostQueryDto";
import type AudioExtractionGetFileQueryDto from "../models/AudioExtractionGetFileQueryDto";
import type { AudioEditorOperationStatusDto } from "../models/AudioEditorOperationStatusDto";
import { apiFetch } from "./client";

export async function submitAudioExtractorData(
  config: AudioExtractionPostQueryDto,
): Promise<AudioExtractionGetFileQueryDto> {
  const path = `${import.meta.env.VITE_API_EXTRACT_AUDIO_URL}`;

  return apiFetch<AudioExtractionGetFileQueryDto>(path, {
    method: "POST",
    body: JSON.stringify(config),
  });
}

export async function fetchOperationStatus(
  statusUrl: string,
  operationId: string,
): Promise<AudioEditorOperationStatusDto> {
  const url = new URL(statusUrl);
  url.searchParams.set("operationId", operationId);

  return apiFetch<AudioEditorOperationStatusDto>(url.toString());
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
  const form = new FormData();
  form.append("OperationId", payload.operationId);
  form.append("GuildId", payload.guildId);
  form.append("Title", payload.title);
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

  await apiFetch<void>(`${import.meta.env.VITE_API_UPLOAD_AUDIO_URL}`, {
    method: "POST",
    body: form,
  });
}
