import React from "react";
import { Box, Typography, Link, Button } from "@mui/material";
import FeastIconBlue from "../../graphics/FeastIconBlue";

const DataSourceIndexEmptyState = () => {
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
        There are no data sources
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, maxWidth: 600 }}>
        This project does not have any Data Sources. Learn more about creating
        Data Sources in Feast Docs.
      </Typography>
      <Button
        variant="contained"
        onClick={() => {
          window.open(
            "https://docs.feast.dev/getting-started/concepts/data-source",
            "_blank",
          );
        }}
        sx={{ mb: 4 }}
      >
        Open Data Sources Docs
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

export default DataSourceIndexEmptyState;
