import React from "react";
import { Box, Typography, Link, Button } from "@mui/material";
import FeastIconBlue from "../../graphics/FeastIconBlue";

const FeatureServiceIndexEmptyState = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        py: 8,
        px: 4,
      }}
    >
      <Box sx={{ mb: 3 }}>
        <FeastIconBlue />
      </Box>
      <Typography variant="h4" component="h2" sx={{ mb: 2 }}>
        There are no feature services
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, maxWidth: 600 }}>
        This project does not have any Feature Services. Learn more about
        creating Feature Services in Feast Docs.
      </Typography>
      <Button
        variant="contained"
        onClick={() => {
          window.open(
            "https://docs.feast.dev/getting-started/concepts/feature-retrieval#feature-services",
            "_blank",
          );
        }}
        sx={{ mb: 4 }}
      >
        Open Feature Services Docs
      </Button>
      <Box>
        <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
          Want to learn more?
        </Typography>
        <Link href="https://docs.feast.dev/" target="_blank">
          Read Feast documentation
        </Link>
      </Box>
    </Box>
  );
};

export default FeatureServiceIndexEmptyState;
