import React from "react";

import {
  // Feature View Custom Tabs will get these props
  StreamFeatureViewCustomTabProps,
} from "../types";

import { Skeleton, Box, Typography, Stack } from "@mui/material";

// Separating out the query is not required,
// but encouraged for code readability
import useDemoQuery from "./useDemoQuery";

const DemoCustomTab = ({
  id,
  feastObjectQuery,
}: StreamFeatureViewCustomTabProps) => {
  // Use React Query to fetch data
  // that is custom to this tab.
  // See: https://react-query.tanstack.com/guides/queries
  const { isLoading, isError, isSuccess, data } = useDemoQuery({
    featureView: id,
  });

  if (isLoading) {
    // Handle Loading State
    return (
      <Box>
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" />
      </Box>
    );
  }

  if (isError) {
    // Handle Data Fetching Error
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 4,
        }}
      >
        <Typography variant="h5" color="error" gutterBottom>
          Unable to load your demo page
        </Typography>
        <Typography variant="body1" color="text.secondary">
          There was an error loading the Dashboard application. Contact your
          administrator for help.
        </Typography>
      </Box>
    );
  }

  // Feast UI uses the MaterialUI component system.
  // <Stack> and <Box> are particularly
  // useful for layouts.
  return (
    <React.Fragment>
      <Stack direction="row" spacing={2}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body1">
            Hello World. The following is fetched data.
          </Typography>
          <Box sx={{ my: 2 }} />
          {isSuccess && data && (
            <Typography
              component="pre"
              sx={{
                fontFamily: "monospace",
                bgcolor: "grey.100",
                p: 1,
                borderRadius: 1,
                overflow: "auto",
              }}
            >
              {JSON.stringify(data, null, 2)}
            </Typography>
          )}
        </Box>
        <Box sx={{ flexGrow: 2 }}>
          <Typography variant="body1">
            ... and this is data from Feast UI&rsquo;s own query.
          </Typography>
          <Box sx={{ my: 2 }} />
          {feastObjectQuery.isSuccess && feastObjectQuery.data && (
            <Typography
              component="pre"
              sx={{
                fontFamily: "monospace",
                bgcolor: "grey.100",
                p: 1,
                borderRadius: 1,
                overflow: "auto",
              }}
            >
              {JSON.stringify(feastObjectQuery.data, null, 2)}
            </Typography>
          )}
        </Box>
      </Stack>
    </React.Fragment>
  );
};

export default DemoCustomTab;
