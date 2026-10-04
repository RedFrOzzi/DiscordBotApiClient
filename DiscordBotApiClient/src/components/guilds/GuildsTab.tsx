import { useEffect, useState } from "react";
import {
  Box,
  Avatar,
  ButtonBase,
  Tabs,
  Tab,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Alert,
} from "@mui/material";
import TagIcon from "@mui/icons-material/Tag";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import MicOffIcon from "@mui/icons-material/MicOff";
import HeadsetOffIcon from "@mui/icons-material/HeadsetOff";
import { useDiscordData } from "../../api/useDiscordData";
import type { DiscordChannel, DiscordUser } from "../../api/discordApi";

type InnerTab = "channels" | "users";

export function GuildsTab() {
  const { guilds, isLoading, isError, usersByGuild, channelsByGuild } =
    useDiscordData();
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);
  const [innerTab, setInnerTab] = useState<InnerTab>("channels");

  // Auto-select the first guild once data arrives
  useEffect(() => {
    if (!selectedGuildId && guilds.length > 0 && guilds[0].id) {
      setSelectedGuildId(guilds[0].id);
    }
    // If the selected guild disappears (e.g. after refetch), reset
    if (selectedGuildId && !guilds.some((g) => g.id === selectedGuildId)) {
      setSelectedGuildId(guilds[0]?.id ?? null);
    }
  }, [guilds, selectedGuildId]);

  if (isLoading) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Не удалось загрузить гильдии.</Alert>
      </Box>
    );
  }

  if (guilds.length === 0) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <Typography color="text.secondary">Нет доступных гильдий.</Typography>
      </Box>
    );
  }

  const channels = selectedGuildId
    ? (channelsByGuild.get(selectedGuildId) ?? [])
    : [];
  const users = selectedGuildId
    ? (usersByGuild.get(selectedGuildId) ?? [])
    : [];

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        minHeight: 420,
        minWidth: 0,
      }}
    >
      {/* Left rail: guild avatars */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          p: 1.5,
          overflowY: "auto",
          borderRight: "1px solid",
          borderColor: (t) => `${t.col.border}`,
          flexShrink: 0,
        }}
      >
        {guilds.map((g) => {
          if (!g.id) return null;
          const selected = g.id === selectedGuildId;
          const initials = g.name?.trim().slice(0, 2).toUpperCase() || "?";
          const icon = g.iconUrl;

          return (
            <ButtonBase
              key={g.id}
              onClick={() => setSelectedGuildId(g.id)}
              title={g.name ?? undefined}
              sx={{
                borderRadius: "14px",
                p: 0.5,
                border: "2px solid",
                borderColor: selected ? "app.accent" : "transparent",
                transition: "border-color .15s",
                "&:hover": {
                  borderColor: (t) => `${t.col.border}`,
                },
              }}
            >
              <Avatar
                src={icon || undefined}
                variant="rounded"
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "10px",
                  bgcolor: (t) => `${t.col.bg_box_light}`,
                  color: "app.text",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {initials}
              </Avatar>
            </ButtonBase>
          );
        })}
      </Box>

      {/* Right pane */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Tabs
          value={innerTab}
          onChange={(_e, v: InnerTab) => setInnerTab(v)}
          sx={{
            minHeight: 44,
            borderBottom: "1px solid",
            borderColor: (t) => `${t.col.border}`,
            "& .MuiTab-root": {
              minHeight: 44,
              textTransform: "none",
            },
            "& .MuiTabs-indicator": {
              bgcolor: "app.accent",
            },
          }}
        >
          <Tab value="channels" label="Каналы" />
          <Tab value="users" label="Пользователи" />
        </Tabs>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            px: 1,
            py: 1,
          }}
        >
          {innerTab === "channels" ? (
            <ChannelsList channels={channels} />
          ) : (
            <UsersList users={users} />
          )}
        </Box>
      </Box>
    </Box>
  );
}

/* Channels list */

function ChannelsList({ channels }: { channels: DiscordChannel[] }) {
  if (channels.length === 0) {
    return <EmptyHint text="В этой гильдии нет каналов." />;
  }

  return (
    <List dense disablePadding>
      {channels.map((c) => (
        <ListItem key={c.id} disableGutters sx={{ px: 1 }}>
          <ListItemAvatar sx={{ minWidth: 36 }}>
            {c.isTextChannel ? (
              <TagIcon fontSize="small" sx={{ color: "app.accent" }} />
            ) : (
              <VolumeUpIcon fontSize="small" sx={{ color: "app.accent" }} />
            )}
          </ListItemAvatar>
          <ListItemText
            primary={c.name ?? "—"}
            sx={{ color: "col.text", fontSize: 14 }}
          />
        </ListItem>
      ))}
    </List>
  );
}

/* Users list */

function UsersList({ users }: { users: DiscordUser[] }) {
  if (users.length === 0) {
    return <EmptyHint text="В этой гильдии нет пользователей." />;
  }

  return (
    <List dense disablePadding>
      {users.map((u) => {
        const displayName = u.nickname?.trim() || u.username;
        const voice = u.voiceState;

        return (
          <ListItem key={u.id} disableGutters sx={{ px: 1 }}>
            <ListItemAvatar>
              <Avatar
                src={u.imageURL ?? undefined}
                variant="rounded"
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  bgcolor: (t) => `${t.col.border}`,
                  color: "col.text",
                  fontSize: 12,
                }}
              >
                {displayName.slice(0, 2).toUpperCase()}
              </Avatar>
            </ListItemAvatar>

            <ListItemText
              primary={displayName}
              secondary={
                u.nickname && u.nickname !== u.username
                  ? `@${u.username}`
                  : undefined
              }
              slotProps={{
                primary: {
                  color: "col.text",
                  sx: {
                    fontSize: 14,
                  },
                },
                secondary: {
                  sx: {
                    fontSize: 12,
                  },
                },
              }}
            />

            {voice && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  color: "text.secondary",
                }}
              >
                <GraphicEqIcon fontSize="small" />
                {voice.isMuted && <MicOffIcon fontSize="small" />}
                {voice.isDeafened && <HeadsetOffIcon fontSize="small" />}
              </Box>
            )}
          </ListItem>
        );
      })}
    </List>
  );
}

/* ---------------- Shared ---------------- */

function EmptyHint({ text }: { text: string }) {
  return (
    <Box sx={{ py: 5, textAlign: "center" }}>
      <Typography variant="body2" color="text.secondary">
        {text}
      </Typography>
    </Box>
  );
}
