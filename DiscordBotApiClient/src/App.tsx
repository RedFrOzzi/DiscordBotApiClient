import "./App.css";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import AudioEditorTab from "./assets/audio_editor_tab/AudioEditorTab";
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
          height: "100dvh",
          width: "var(--app-width)",
          marginTop: "var(--app-tb-margin)",
          marginBottom: "var(--app-tb-margin)",
          borderRadius: "var(--app-border-radius)",
          backgroundColor: "var(--bg-app)",
        }}
      >
        <Tabs value={tab} onChange={handleChange} centered>
          <Tab value={"message"} label="Сообщение" />
          <Tab value={"embed"} label="Вложенное сообщение" />
          <Tab value={"audio"} label="Аудио" />
        </Tabs>
        {tab === "message" && <div>Контент для «Сообщение»</div>}
        {tab === "embed" && <div>Контент для «Вложенное сообщение»</div>}
        <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          {tab === "audio" && <AudioEditorTab />}
        </Box>
      </Box>
    </div>
  );
}

export default App;
