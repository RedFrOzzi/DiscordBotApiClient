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
import { AuthProvider } from "./auth/AuthProvider.tsx";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#afd6ee",
      contrastText: "#03041a",
    },
    background: {
      default: "#03041a",
    },
  },
  col: {
    bg_global_dark: "#101b2e",
    bg_global_light: "#192946",
    bg_box_dark: "#0f2a3d",
    bg_box_light: "#1e3a5f",
    bg_100: "#060b12",
    bg_200: "#101b2e",
    bg_300: "#192946",
    bg_400: "#0f2a3d",
    bg_500: "#20355a",
    bg_600: "#1e3a5f",
    bg_700: "#255c93",
    bg_800: "#347ec7",
    bg_900: "#3f96ed",
    details: "#06D6A0",
    border: "#255c93",
    border_light: "#347ec7",
    text: "#eaeaea",

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
        <AuthProvider>
          <App />
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
