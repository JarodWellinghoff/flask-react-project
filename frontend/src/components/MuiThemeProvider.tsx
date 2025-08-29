// src/components/theme/MuiThemeProvider.tsx
"use client";

import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
  palette: {
    primary: {
      main: "#3b82f6", // Blue
    },
    secondary: {
      main: "#8b5cf6", // Purple
    },
    success: {
      main: "#10b981", // Green
    },
    error: {
      main: "#ef4444", // Red
    },
    warning: {
      main: "#f59e0b", // Yellow
    },
    info: {
      main: "#06b6d4", // Cyan
    },
    background: {
      default: "#f3f4f6",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      "Oxygen",
      "Ubuntu",
      "Cantarell",
      '"Fira Sans"',
      '"Droid Sans"',
      '"Helvetica Neue"',
      "sans-serif",
    ].join(","),
    h1: {
      fontSize: "2rem",
      fontWeight: 700,
      color: "#1f2937",
    },
    h2: {
      fontSize: "1.5rem",
      fontWeight: 600,
      color: "#1f2937",
    },
    h3: {
      fontSize: "1.25rem",
      fontWeight: 600,
      color: "#1f2937",
    },
    h4: {
      fontSize: "1.125rem",
      fontWeight: 600,
      color: "#1f2937",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          borderRadius: "0.5rem",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: "0.5rem",
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: "0.75rem",
          height: "1.5rem",
        },
        bar: {
          borderRadius: "0.75rem",
        },
      },
    },
  },
  spacing: 8,
});

export function MuiThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
