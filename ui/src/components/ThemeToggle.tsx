import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { useTheme } from "../contexts/ThemeContext";

const ThemeToggle: React.FC = () => {
  const { colorMode, toggleColorMode } = useTheme();

  return (
    <Tooltip
      title={`Switch to ${colorMode === "light" ? "dark" : "light"} theme`}
      placement="right"
    >
      <IconButton
        onClick={toggleColorMode}
        aria-label={`Switch to ${colorMode === "light" ? "dark" : "light"} theme`}
        color="inherit"
      >
        {colorMode === "light" ? <Brightness4 /> : <Brightness7 />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
