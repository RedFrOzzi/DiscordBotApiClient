import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type AudioExtractionPostQueryDto from "../models/AudioExtractionPostQueryDto";
import type AudioExtractionGetFileQueryDto from "../models/AudioExtractionGetFileQueryDto";
import type { AudioEditorOperationStatusDto } from "../models/AudioEditorOperationStatusDto";
import {
  fetchOperationStatus,
  submitAudioExtractorData,
} from "./audioExtractionQuerys";

interface UseAudioExtractOptions {
  pollIntervalMs?: number;
}

const extractOperationKey = "extract-operation";

export function useAudioExtract({
  pollIntervalMs = 3000,
}: UseAudioExtractOptions = {}) {
  const queryClient = useQueryClient();

  const [operation, setOperation] = useState<{
    statusUrl: string;
    operationId: string;
  } | null>(null);

  // --- Mutation: POST to begin-extraction ---
  const submitMutation = useMutation<
    AudioExtractionGetFileQueryDto,
    Error,
    AudioExtractionPostQueryDto
  >({
    mutationFn: submitAudioExtractorData,
    onSuccess: (data) => {
      setOperation({
        statusUrl: data.statusUrl,
        operationId: data.operationId,
      });
    },
  });

  // --- Query: poll check-extraction?operationId=... ---
  const statusQuery = useQuery<AudioEditorOperationStatusDto, Error>({
    queryKey: [extractOperationKey, operation?.operationId],
    queryFn: () =>
      fetchOperationStatus(operation!.statusUrl, operation!.operationId),
    enabled: !!operation,
    retry: false,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "succeeded" || data?.status === "failed") {
        return false;
      }
      return pollIntervalMs;
    },
  });

  // --- Reset helper so the component can start a fresh submission ---
  const reset = useCallback(() => {
    setOperation(null);
    queryClient.removeQueries({ queryKey: [extractOperationKey] });
  }, [queryClient]);

  const submit = useCallback(
    (config: AudioExtractionPostQueryDto) => {
      reset();
      submitMutation.mutate(config);
    },
    [reset, submitMutation],
  );

  // --- Derived: final download URL, only valid when status === "succeeded" ---
  const downloadUrl = useMemo(() => {
    if (!operation) return null;
    const data = statusQuery.data;
    if (data?.status !== "succeeded") return null;

    try {
      const resUrl = new URL(data.getExtractedAudioUrl);
      resUrl.searchParams.set("operationId", operation.operationId);
      return resUrl.toString();
    } catch {
      return null;
    }
  }, [operation, statusQuery.data]);

  const isSubmitting = submitMutation.isPending;
  const isPolling = statusQuery.data?.status === "pending";
  const isWorking = isSubmitting || isPolling;

  return {
    submit,
    reset,
    isWorking,
    isSubmitting,
    isPolling,
    finalStatus: statusQuery.data,
    operationId: operation?.operationId ?? null,
    downloadUrl,
    submitError: submitMutation.error,
    isSubmitError: submitMutation.isError,
  };
}
