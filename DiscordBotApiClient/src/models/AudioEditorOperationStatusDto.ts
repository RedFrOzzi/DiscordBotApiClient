export type AudioEditorOperationStatusDto = {
  status: OperationStatus;
  resultMessage: string;
  getExtractedAudioUrl: string;
};

export type OperationStatus = "pending" | "succeeded" | "failed" | undefined;
