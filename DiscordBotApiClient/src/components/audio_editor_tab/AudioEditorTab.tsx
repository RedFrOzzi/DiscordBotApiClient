import { Box, Snackbar, Alert as MuiAlert } from "@mui/material";
import { useState } from "react";
import { AudioExtractionForm } from "./AudioEditorDataSubmitForm";
import AudioWaveformEditor from "./AudioWaveformEditor";

type AudioEditorTabProps = {
  tabName: string;
  onExtracted?: (fileUrl: string) => void;
};

function AudioEditorTab({ tabName, onExtracted }: AudioEditorTabProps) {
  const [audio, setAudio] = useState<{
    url: string;
    operationId: string;
  } | null>(null);
  const [uploadedToast, setUploadedToast] = useState(false);
  const [extractedToast, setExtractedToast] = useState(false);
  const [failedExtractionToast, setFailedExtractionToast] = useState(false);
  const [failedExtractionMsg, setFailedExtractionMsg] = useState("");

  const handleExtracted = (url: string, operationId: string) => {
    setAudio({ url, operationId });
    onExtracted?.(url);
    setExtractedToast(true);
  };

  const handleUploaded = () => {
    setAudio(null);
    setUploadedToast(true);
  };

  const handleExtractError = (msg: string) => {
    setFailedExtractionMsg(msg);
    setFailedExtractionToast(true);
  };

  return (
    <Box>
      <AudioExtractionForm
        onSuccess={handleExtracted}
        onError={handleExtractError}
        pollIntervalMs={3000}
      />

      {audio && (
        <AudioWaveformEditor
          key={audio.url}
          url={audio.url}
          operationId={audio.operationId}
          tabName={tabName}
          onUploaded={handleUploaded}
        />
      )}

      <Snackbar
        open={extractedToast}
        autoHideDuration={3000}
        onClose={() => setExtractedToast(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          severity="success"
          variant="filled"
          onClose={() => setExtractedToast(false)}
        >
          Трек успешно извлечён.
        </MuiAlert>
      </Snackbar>

      <Snackbar
        open={failedExtractionToast}
        onClose={() => setFailedExtractionToast(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          severity="error"
          variant="filled"
          onClose={() => setFailedExtractionToast(false)}
        >
          {failedExtractionMsg}
        </MuiAlert>
      </Snackbar>

      <Snackbar
        open={uploadedToast}
        autoHideDuration={3000}
        onClose={() => setUploadedToast(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          severity="success"
          variant="filled"
          onClose={() => setUploadedToast(false)}
        >
          Трек успешно сохранён.
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}

export default AudioEditorTab;
