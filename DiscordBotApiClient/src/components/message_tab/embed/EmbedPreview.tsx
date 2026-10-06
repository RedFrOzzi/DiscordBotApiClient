import { Box, Typography } from "@mui/material";
import type { EmbedState } from "./types";

function formatTimestamp(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hasContent(embed: EmbedState): boolean {
  if (embed.title?.trim()) return true;
  if (embed.description?.trim()) return true;
  if (embed.url?.trim()) return true;
  if (embed.timestamp) return true;
  if (embed.footer?.text?.trim()) return true;
  if (embed.image?.url?.trim()) return true;
  if (embed.thumbnail?.url?.trim()) return true;
  if (embed.author?.name?.trim()) return true;
  if (embed.fields?.some((f) => f.name.trim() || f.value.trim())) return true;
  return false;
}

export function EmbedPreview({ embed }: { embed: EmbedState }) {
  if (!hasContent(embed)) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: "center",
          border: "1px dashed",
          borderColor: "rgba(255,255,255,0.15)",
          borderRadius: 2,
          color: (t) => t.col.text,
          fontSize: 13,
        }}
      >
        Предпросмотр появится здесь
      </Box>
    );
  }

  const color = embed.color || "#06D6A0";
  const ts = formatTimestamp(embed.timestamp);
  const fields = (embed.fields ?? []).filter(
    (f) => f.name.trim() || f.value.trim(),
  );

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1.5,
        bgcolor: "#2b2d31",
        borderLeft: `4px solid ${color}`,
        maxWidth: 520,
        color: "#dbdee1",
      }}
    >
      {/* Author */}
      {embed.author?.name?.trim() && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
          {embed.author.iconUrl?.trim() && (
            <img
              src={embed.author.iconUrl}
              alt=""
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                objectFit: "cover",
              }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          {embed.author.url?.trim() ? (
            <a
              href={embed.author.url}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#dbdee1", fontSize: 14, fontWeight: 600 }}
            >
              {embed.author.name}
            </a>
          ) : (
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
              {embed.author.name}
            </Typography>
          )}
        </Box>
      )}

      {/* Main body: text left, thumbnail right */}
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {embed.title?.trim() &&
            (embed.url?.trim() ? (
              <a
                href={embed.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "#00a8fc",
                  fontSize: 16,
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                {embed.title}
              </a>
            ) : (
              <Typography
                sx={{
                  color: "#f2f3f5",
                  fontSize: 16,
                  fontWeight: 600,
                  mb: 0.75,
                }}
              >
                {embed.title}
              </Typography>
            ))}

          {embed.description?.trim() && (
            <Typography
              sx={{
                fontSize: 14,
                whiteSpace: "pre-wrap",
                lineHeight: 1.4,
                mb: fields.length ? 1.25 : 0,
              }}
            >
              {embed.description}
            </Typography>
          )}

          {fields.length > 0 && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 1.25,
                mt: 0.75,
              }}
            >
              {fields.map((f, i) => (
                <Box
                  key={i}
                  sx={{
                    gridColumn: f.inline ? "auto" : "span 3",
                    minWidth: 0,
                  }}
                >
                  {f.name.trim() && (
                    <Typography
                      sx={{ fontSize: 14, fontWeight: 600, color: "#f2f3f5" }}
                    >
                      {f.name}
                    </Typography>
                  )}
                  {f.value.trim() && (
                    <Typography
                      sx={{
                        fontSize: 14,
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.4,
                      }}
                    >
                      {f.value}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {embed.thumbnail?.url?.trim() && (
          <img
            src={embed.thumbnail.url}
            alt=""
            style={{
              width: 80,
              height: 80,
              borderRadius: 4,
              objectFit: "cover",
              flexShrink: 0,
            }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        )}
      </Box>

      {/* Image */}
      {embed.image?.url?.trim() && (
        <Box
          component="img"
          src={embed.image.url}
          alt=""
          sx={{
            display: "block",
            width: "100%",
            maxHeight: 300,
            objectFit: "cover",
            borderRadius: 1,
            mt: 1,
          }}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}

      {/* Footer */}
      {(embed.footer?.text?.trim() || ts) && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mt: 1.25,
            fontSize: 12,
            color: "#949ba4",
          }}
        >
          {embed.footer?.iconUrl?.trim() && (
            <img
              src={embed.footer.iconUrl}
              alt=""
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                objectFit: "cover",
              }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          {embed.footer?.text?.trim() && <span>{embed.footer.text}</span>}
          {embed.footer?.text?.trim() && ts && <span>•</span>}
          {ts && <span>{ts}</span>}
        </Box>
      )}
    </Box>
  );
}
