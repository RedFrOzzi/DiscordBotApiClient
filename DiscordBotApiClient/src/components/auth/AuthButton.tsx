import { useState } from "react";
import {
  Button,
  Menu,
  MenuItem,
  Avatar,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  useTheme,
  Box,
  Divider,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import { useAuth } from "../../auth/useAuth";
import { LoginDialog } from "./LoginDialog";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { AdminVerificationDialog } from "./AdminVerificationDialog";

type Props = {
  avatarUrl?: string;
};

export function AuthButton({ avatarUrl }: Props) {
  const { isAuthenticated, tryRestoreSession, logout } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [checking, setChecking] = useState(false);
  const [dialogMode, setDialogMode] = useState<"login" | "register">("login");
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);

  const theme = useTheme();

  const handleSignInClick = async () => {
    setChecking(true);
    const restored = await tryRestoreSession();
    setChecking(false);
    if (!restored) {
      setDialogMode("login");
      setDialogOpen(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <Box sx={{ mb: 1, display: "flex", gap: 1 }}>
          <Button
            onClick={handleSignInClick}
            disabled={checking}
            variant="contained"
            startIcon={
              checking ? <CircularProgress size={16} /> : <LoginIcon />
            }
          >
            {checking ? "Проверяю…" : "Войти"}
          </Button>
          <Button
            onClick={() => {
              setDialogMode("register");
              setDialogOpen(true);
            }}
            disabled={checking}
            variant="text"
          >
            Регистрация
          </Button>
        </Box>

        <LoginDialog
          open={dialogOpen}
          mode={dialogMode}
          onClose={() => setDialogOpen(false)}
        />
      </>
    );
  }

  const handleLogout = async () => {
    setMenuAnchor(null);
    await logout();
  };

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar
          src={avatarUrl}
          variant="rounded"
          sx={{
            width: 32,
            height: 32,
            borderRadius: "8px",
            color: "app.text",
          }}
        >
          <PersonIcon sx={{ fontSize: 18 }} />
        </Avatar>

        <Button
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          aria-label="account menu"
          variant="contained"
          sx={{
            px: 2,
          }}
        >
          Настройки
        </Button>
      </Box>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              background: `linear-gradient(180deg, ${theme.col.bg_box_light} 0%, ${theme.col.bg_box_dark} 100%)`,
              color: theme.col.wf_text,
              border: "1px solid",
              borderColor: (t) => `${t.col.border}`,
              minWidth: 180,
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            setAdminDialogOpen(true);
          }}
        >
          <ListItemIcon>
            <AdminPanelSettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Подтверждение</ListItemText>
        </MenuItem>

        <Divider sx={{ borderColor: (t) => t.col.border }} />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" sx={{ color: "red" }} />
          </ListItemIcon>
          <ListItemText>Выйти</ListItemText>
        </MenuItem>
      </Menu>

      <AdminVerificationDialog
        open={adminDialogOpen}
        onClose={() => setAdminDialogOpen(false)}
      />
    </>
  );
}
