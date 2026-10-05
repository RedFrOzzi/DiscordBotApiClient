import "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Theme {
    col: {
      bg_global_dark: string;
      bg_global_light: string;
      bg_box_dark: string;
      bg_box_light: string;
      bg_100: string;
      bg_200: string;
      bg_300: string;
      bg_400: string;
      bg_500: string;
      bg_600: string;
      bg_700: string;
      bg_800: string;
      bg_900: string;
      details: string;
      accent: string;
      border: string;
      border_light: string;
      text: string;

      wf_main: string;
      wf_played: string;
      wf_region: string;
      wf_region_playing: string;
      wf_cursor: string;
      wf_cursor_mouse: string;
      wf_text: string;
    };
  }
  interface ThemeOptions {
    col?: {
      bg_global_dark?: string;
      bg_global_light?: string;
      bg_box_dark?: string;
      bg_box_light?: string;
      bg_100?: string;
      bg_200?: string;
      bg_300?: string;
      bg_400?: string;
      bg_500?: string;
      bg_600?: string;
      bg_700?: string;
      bg_800?: string;
      bg_900?: string;
      details?: string;
      accent?: string;
      border?: string;
      border_light?: string;
      text?: string;

      wf_main?: string;
      wf_played?: string;
      wf_region?: string;
      wf_region_playing?: string;
      wf_cursor?: string;
      wf_cursor_mouse?: string;
      wf_text?: string;
    };
  }
}
