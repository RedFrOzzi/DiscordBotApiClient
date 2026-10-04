import "./App.css";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import AudioEditorTab from "./components/audio_editor_tab/AudioEditorTab";
import { useEffect, useState } from "react";
import { AuthButton } from "./components/auth/AuthButton";
import { useAuth } from "./auth/useAuth";
import { AdminDashboard } from "./components/admin_dashboard/AdminDashboard";
import { Typography } from "@mui/material";
import { GuildsTab } from "./components/guilds/GuildsTab";
import { MessagingTab } from "./components/message_tab/MessagingTab";

function App() {
  const [tab, setTab] = useState("message");

  const { isAdmin, isModerator } = useAuth();
  const canSeeAdmin = isAdmin || isModerator;

  useEffect(() => {
    if (!canSeeAdmin && tab === "admin") {
      setTab("message");
    }
  }, [canSeeAdmin, tab]);

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
          pb: 0,
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
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            px: 2,
            borderBottom: "1px solid",
            borderColor: (t) => `${t.palette.primary.main}60`,
            boxShadow: (t) => `0 8px 16px -8px ${t.col.bg_global_light}`,
          }}
        >
          <Box />
          {!canSeeAdmin && (
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>
              DISCORD BOT
            </Typography>
          )}
          {canSeeAdmin && (
            <Tabs value={tab} onChange={handleChange} centered>
              <Tab value={"message"} label="Сообщение" />
              <Tab value={"audio"} label="Аудио" />
              <Tab value={"guilds"} label="Каналы" />
              <Tab value={"admin"} label="Управление" />
            </Tabs>
          )}
          <Box sx={{ pr: 5, justifySelf: "end" }}>
            <AuthButton avatarUrl="" />
          </Box>
        </Box>
        {tab === "message" && <MessagingTab />}
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
        {tab === "guilds" && <GuildsTab />}
        {tab === "admin" && <AdminDashboard />}
      </Box>
    </div>
  );
}

export default App;
