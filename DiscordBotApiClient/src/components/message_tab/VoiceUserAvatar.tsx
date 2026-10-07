import { Avatar, Box, Tooltip, Typography } from "@mui/material";
import MicOffIcon from "@mui/icons-material/MicOff";
import HeadsetOffIcon from "@mui/icons-material/HeadsetOff";
import type { DiscordUser } from "../../api/discordApi";

type Props = {
  user: DiscordUser;
  muted: boolean;
  deafened: boolean;
};

function pickDisplayName(user: DiscordUser): string {
  if (user.nickname?.trim()) return user.nickname.trim();
  if (user.globalName?.trim()) return user.globalName.trim();
  if (user.username?.trim()) return user.username.trim();
  return "Unknown";
}

export function VoiceUserAvatar({ user, muted, deafened }: Props) {
  const displayName = pickDisplayName(user);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        minWidth: 0,
        width: "100%",
      }}
    >
      <Tooltip title={displayName} arrow>
        <Avatar
          src={user.imageURL ?? undefined}
          sx={{
            width: 28,
            height: 28,
            fontSize: 11,
            bgcolor: (t) => t.col.bg_800,
            color: (t) => t.col.text,
          }}
        >
          {displayName.slice(0, 2).toUpperCase()}
        </Avatar>
      </Tooltip>

      {muted && (
        <Tooltip title="Muted" arrow>
          <MicOffIcon sx={{ fontSize: 18, color: "#e5484d" }} />
        </Tooltip>
      )}

      {deafened && (
        <Tooltip title="Deafened" arrow>
          <HeadsetOffIcon sx={{ fontSize: 18, color: "#e5484d" }} />
        </Tooltip>
      )}

      <Typography
        variant="body2"
        sx={{
          fontSize: 13,
          color: (t) => t.col.text,
          ml: 0.5,
          flex: 1,
          minWidth: 0,
          maxWidth: 150,
        }}
        noWrap
        title={displayName}
      >
        {displayName}
      </Typography>
    </Box>
  );
}
