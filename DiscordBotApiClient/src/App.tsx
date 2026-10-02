import "./App.css";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import AudioEditorTab from "./components/audio_editor_tab/AudioEditorTab";
import { useState } from "react";

function App() {
  const [tab, setTab] = useState("message");

  const handleChange = (
    _event: React.SyntheticEvent<Element, Event>,
    newValue: React.SetStateAction<string>,
  ) => {
    setTab(newValue);
  };

  return (
    <div id="application">
      <Box
        sx={{
          pb: 10,
          pt: 2,
          width: "var(--app-width)",
          marginTop: "var(--app-tb-margin)",
          marginBottom: "var(--app-tb-margin)",
          borderRadius: "var(--app-border-radius)",
          background: `radial-gradient(circle at 25% 20%, #2f5580 0%, transparent 55%),
            radial-gradient(circle at 80% 75%, #1e3a5f 0%, transparent 60%),
            radial-gradient(circle at 50% 50%, rgba(6, 214, 160, 0.12) 0%, transparent 70%),
            linear-gradient(135deg, #1f3556 0%, #2a4a72 50%, #192a48 100%)`,
          boxShadow: `0 0 50px rgba(6, 214, 160, 0.12),
              0 10px 30px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
        }}
      >
        <Tabs value={tab} onChange={handleChange} centered>
          <Tab value={"message"} label="Сообщение" />
          <Tab value={"embed"} label="Вложенное сообщение" />
          <Tab value={"audio"} label="Аудио" />
        </Tabs>
        {tab === "message" && <div>Контент для «Сообщение»</div>}
        {tab === "embed" && <div>Контент для «Вложенное сообщение»</div>}
        <Box
          sx={
            tab === "audio"
              ? { flex: 1, minHeight: 0, overflow: "auto" }
              : {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  visibility: "hidden",
                  pointerEvents: "none",
                }
          }
        >
          <AudioEditorTab tabName={tab} />
        </Box>
      </Box>
    </div>
  );
}

export default App;
