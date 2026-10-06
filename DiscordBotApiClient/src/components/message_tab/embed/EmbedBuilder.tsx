import { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemText,
  TextField,
  Stack,
  Typography,
  FormControlLabel,
  Switch,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { useEmbed } from "./EmbedProvider";
import { EmbedPreview } from "./EmbedPreview";
import type { EmbedPropertyKey } from "./types";
import { Delete } from "@mui/icons-material";

function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

const PROPERTY_LABELS: Record<EmbedPropertyKey, string> = {
  title: "Заголовок",
  description: "Описание",
  url: "URL заголовка",
  timestamp: "Время",
  color: "Цвет",
  footer: "Подпись",
  image: "Изображение",
  thumbnail: "Миниатюра изображения",
  author: "Автор",
  fields: "Поле",
};

const SINGULAR_ORDER: EmbedPropertyKey[] = [
  "author",
  "title",
  "description",
  "url",
  "color",
  "thumbnail",
  "image",
  "timestamp",
  "footer",
  "fields",
];

const textFieldStyle = {
  "& .MuiOutlinedInput-input": {
    padding: "5px 8px",
  },
  "& .MuiInputLabel-root": {
    fontSize: "0.9rem",
    transform: "translate(14px, 6px) scale(1)",
  },
  "& .MuiInputLabel-shrink": {
    transform: "translate(14px, -6px) scale(0.75)",
  },
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: (t: any) => t.col.border_light,
    },
    "&:hover fieldset": {
      borderColor: (t: any) => t.col.bg_900,
    },
    "&.Mui-focused fieldset": {
      borderColor: (t: any) => t.col.border_light,
    },
  },
};

const MAX_FIELDS = 5;

function SectionShell({
  label,
  onRemove,
  children,
}: {
  label: string;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        px: 1,
        pb: 1,
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: (t) => `${t.col.border_light}`,
        background: (t) =>
          `linear-gradient(180deg, ${t.col.bg_global_light} 0%, ${t.col.bg_global_dark} 100%)`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        <Typography
          variant="button"
          sx={{ color: (t) => t.col.text, flex: 1, fontWeight: 600 }}
        >
          {label}
        </Typography>
        <IconButton
          size="small"
          onClick={onRemove}
          aria-label="remove"
          sx={{ color: "text.secondary", "&:hover": { color: "#ff6b6b" } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      {children}
    </Box>
  );
}

export function EmbedBuilder() {
  const {
    embed,
    addProperty,
    removeProperty,
    updateProperty,
    addField,
    removeField,
    updateField,
    clear,
  } = useEmbed();

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const added = new Set(Object.keys(embed) as EmbedPropertyKey[]);
  const addable = SINGULAR_ORDER.filter((k) => !added.has(k));

  const openMenu = (e: React.MouseEvent<HTMLElement>) =>
    setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);
  const pick = (key: EmbedPropertyKey) => {
    addProperty(key);
    closeMenu();
  };

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", minWidth: "60%", gap: 2 }}
    >
      {/* Header */}
      <Typography
        variant="body1"
        sx={{
          color: (t) => t.col.text,
          flex: 1,
          textAlign: "center",
          fontWeight: 900,
        }}
      >
        КОНСТРУКТОР СООБЩЕНИЙ С ВЛОЖЕННЫМИ ЭЛЕМЕНТАМИ
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={clear}
          disabled={Object.keys(embed).length === 0}
          startIcon={<Delete />}
          sx={{
            color: (t) => t.col.text,
            backgroundColor: (t) => t.col.bg_400,
            borderColor: (t) => t.col.border_light,
            "&:hover": {
              borderColor: (t) => t.col.bg_900,
              bgcolor: (t) => t.col.bg_600,
            },
          }}
        >
          Очистить
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openMenu}
          disabled={addable.length === 0}
        >
          Добавить элемент
        </Button>
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={closeMenu}
          slotProps={{
            paper: {
              sx: {
                bgcolor: (t) => t.col.bg_200,
                backgroundImage: "none",
                border: "1px solid",
                borderColor: (t) => `${t.col.border}`,
                minWidth: 182,
              },
            },
          }}
        >
          {addable.map((k) => (
            <MenuItem key={k} onClick={() => pick(k)}>
              <ListItemText
                primary={PROPERTY_LABELS[k]}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: 14,
                      color: (t) => t.col.text,
                    },
                  },
                }}
              />
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* Builder sections */}
      <Stack spacing={1}>
        {embed.author !== undefined && (
          <SectionShell
            label={PROPERTY_LABELS.author}
            onRemove={() => removeProperty("author")}
          >
            <Stack spacing={1}>
              <TextField
                label="Имя"
                size="small"
                fullWidth
                sx={textFieldStyle}
                value={embed.author.name ?? ""}
                onChange={(e) =>
                  updateProperty("author", {
                    ...embed.author,
                    name: e.target.value,
                  })
                }
              />
              <TextField
                label="URL автора"
                size="small"
                fullWidth
                sx={textFieldStyle}
                value={embed.author.url ?? ""}
                onChange={(e) =>
                  updateProperty("author", {
                    ...embed.author,
                    url: e.target.value,
                  })
                }
              />
              <TextField
                label="URL иконки"
                size="small"
                fullWidth
                sx={textFieldStyle}
                value={embed.author.iconUrl ?? ""}
                onChange={(e) =>
                  updateProperty("author", {
                    ...embed.author,
                    iconUrl: e.target.value,
                  })
                }
              />
            </Stack>
          </SectionShell>
        )}

        {embed.title !== undefined && (
          <SectionShell
            label={PROPERTY_LABELS.title}
            onRemove={() => removeProperty("title")}
          >
            <TextField
              size="small"
              fullWidth
              sx={textFieldStyle}
              value={embed.title}
              onChange={(e) => updateProperty("title", e.target.value)}
            />
          </SectionShell>
        )}

        {embed.description !== undefined && (
          <SectionShell
            label={PROPERTY_LABELS.description}
            onRemove={() => removeProperty("description")}
          >
            <TextField
              size="small"
              fullWidth
              multiline
              minRows={3}
              sx={textFieldStyle}
              value={embed.description}
              onChange={(e) => updateProperty("description", e.target.value)}
            />
          </SectionShell>
        )}

        {embed.url !== undefined && (
          <SectionShell
            label={PROPERTY_LABELS.url}
            onRemove={() => removeProperty("url")}
          >
            <TextField
              size="small"
              fullWidth
              sx={textFieldStyle}
              value={embed.url}
              onChange={(e) => updateProperty("url", e.target.value)}
            />
          </SectionShell>
        )}

        {embed.color !== undefined && (
          <SectionShell
            label={PROPERTY_LABELS.color}
            onRemove={() => removeProperty("color")}
          >
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <input
                type="color"
                value={embed.color || "#06D6A0"}
                onChange={(e) => updateProperty("color", e.target.value)}
                style={{
                  width: 48,
                  height: 36,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
              <TextField
                size="small"
                fullWidth
                sx={textFieldStyle}
                value={embed.color}
                onChange={(e) => updateProperty("color", e.target.value)}
              />
            </Box>
          </SectionShell>
        )}

        {embed.thumbnail !== undefined && (
          <SectionShell
            label={PROPERTY_LABELS.thumbnail}
            onRemove={() => removeProperty("thumbnail")}
          >
            <TextField
              label="URL"
              size="small"
              fullWidth
              sx={textFieldStyle}
              value={embed.thumbnail.url ?? ""}
              onChange={(e) =>
                updateProperty("thumbnail", { url: e.target.value })
              }
            />
          </SectionShell>
        )}

        {embed.image !== undefined && (
          <SectionShell
            label={PROPERTY_LABELS.image}
            onRemove={() => removeProperty("image")}
          >
            <TextField
              label="URL"
              size="small"
              fullWidth
              sx={textFieldStyle}
              value={embed.image.url ?? ""}
              onChange={(e) => updateProperty("image", { url: e.target.value })}
            />
          </SectionShell>
        )}

        {embed.timestamp !== undefined && (
          <SectionShell
            label={PROPERTY_LABELS.timestamp}
            onRemove={() => removeProperty("timestamp")}
          >
            <TextField
              type="datetime-local"
              size="small"
              fullWidth
              sx={textFieldStyle}
              value={toLocalInputValue(embed.timestamp)}
              onChange={(e) =>
                updateProperty(
                  "timestamp",
                  e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null,
                )
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </SectionShell>
        )}

        {embed.footer !== undefined && (
          <SectionShell
            label={PROPERTY_LABELS.footer}
            onRemove={() => removeProperty("footer")}
          >
            <Stack spacing={1}>
              <TextField
                label="Текст"
                size="small"
                fullWidth
                sx={textFieldStyle}
                value={embed.footer.text ?? ""}
                onChange={(e) =>
                  updateProperty("footer", {
                    ...embed.footer,
                    text: e.target.value,
                  })
                }
              />
              <TextField
                label="URL иконки"
                size="small"
                fullWidth
                sx={textFieldStyle}
                value={embed.footer.iconUrl ?? ""}
                onChange={(e) =>
                  updateProperty("footer", {
                    ...embed.footer,
                    iconUrl: e.target.value,
                  })
                }
              />
            </Stack>
          </SectionShell>
        )}

        {embed.fields !== undefined && (
          <SectionShell label="Поля" onRemove={() => removeProperty("fields")}>
            <Stack spacing={1}>
              {embed.fields.length === 0 && (
                <Typography variant="caption" sx={{ color: (t) => t.col.text }}>
                  Полей пока нет.
                </Typography>
              )}

              {embed.fields.map((field, i) => (
                <Box
                  key={i}
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: (t) => `${t.col.border}70`,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 0.5,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: (t) => t.col.text }}
                      >
                        Поле {i + 1}
                      </Typography>
                      <FormControlLabel
                        sx={{ ml: 2 }}
                        control={
                          <Switch
                            size="small"
                            checked={field.inline}
                            onChange={(e) =>
                              updateField(i, { inline: e.target.checked })
                            }
                          />
                        }
                        label={
                          <Typography
                            variant="caption"
                            sx={{ color: (t) => t.col.text }}
                          >
                            В строку
                          </Typography>
                        }
                      />
                    </Box>
                    <Tooltip
                      title="Удалить поле"
                      slotProps={{
                        tooltip: {
                          sx: {
                            color: (t) => t.col.text,
                            backgroundColor: (t) => t.col.bg_global_light,
                            border: (t) => `1px solid ${t.col.border}`,
                          },
                        },
                      }}
                    >
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => removeField(i)}
                          sx={{
                            color: "text.secondary",
                            "&:hover": { color: "#ff6b6b" },
                          }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                  <Stack spacing={1}>
                    <TextField
                      label="Заглавие"
                      size="small"
                      fullWidth
                      sx={textFieldStyle}
                      value={field.name}
                      onChange={(e) => updateField(i, { name: e.target.value })}
                    />
                    <TextField
                      label="Текст"
                      size="small"
                      fullWidth
                      multiline
                      minRows={2}
                      sx={textFieldStyle}
                      value={field.value}
                      onChange={(e) =>
                        updateField(i, { value: e.target.value })
                      }
                    />
                  </Stack>
                </Box>
              ))}

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  alignSelf: "flex-start",
                }}
              >
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addField}
                  disabled={embed.fields.length >= MAX_FIELDS}
                  sx={{
                    color: "app.accent",
                    textTransform: "none",
                    "&.Mui-disabled": { color: "text.disabled" },
                  }}
                >
                  Добавить поле
                </Button>
                <Typography variant="caption" color="text.secondary">
                  {embed.fields.length} / {MAX_FIELDS}
                </Typography>
              </Box>
            </Stack>
          </SectionShell>
        )}
      </Stack>

      {/* Preview */}
      <Box>
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", mb: 1, display: "block" }}
        >
          Предпросмотр
        </Typography>
        <EmbedPreview embed={embed} />
      </Box>
    </Box>
  );
}
