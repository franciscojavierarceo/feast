import React from "react";
import { Box, Typography, Link, Button } from "@mui/material";
import FeastIconBlue from "../../graphics/FeastIconBlue";

const EntityIndexEmptyState = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        py: 8,
        px: 4,
      }}
    >
      <Box sx={{ mb: 3 }}>
        <FeastIconBlue />
      </Box>
      <Typography variant="h4" component="h2" sx={{ mb: 2 }}>
        There are no entities
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, maxWidth: 600 }}>
        This project does not have any Entities. Learn more about creating
        Entities in Feast Docs.
      </Typography>
      <Button
        variant="contained"
        onClick={() => {
          window.open(
            "https://docs.feast.dev/getting-started/concepts/entity",
            "_blank",
          );
        }}
        sx={{ mb: 4 }}
      >
        Open Entities Docs
      </Button>
      <Box>
        <Typography variant="subtitle2" component="h3" sx={{ mb: 1 }}>
          Want to learn more?
        </Typography>
        <Link href="https://docs.feast.dev/" target="_blank">
          Read Feast documentation
        </Link>
      </Box>
    </Box>
  );
};

export default EntityIndexEmptyState;
