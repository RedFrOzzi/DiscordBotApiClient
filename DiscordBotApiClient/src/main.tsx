import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#03041a",
    },
  },
  col: {
    bg_global_dark: "#101b2e",
    bg_global_light: "#192946",
    details: "#06D6A0",

    wf_main: "#06D6A0",
    wf_played: "#047456",
    wf_region: "#fd003b73",
    wf_region_playing: "#fd003b9b",
    wf_cursor: "#f1ebec",
    wf_cursor_mouse: "#040cff",
    wf_text: "#cccccc",
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline enableColorScheme />
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
