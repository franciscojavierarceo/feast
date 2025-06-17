import React from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { Container, Box, Typography, Tabs, Tab } from "@mui/material";

import { FeatureViewIcon } from "../../graphics/FeatureViewIcon";
import { useMatchExact } from "../../hooks/useMatchSubpath";
import StreamFeatureViewOverviewTab from "./StreamFeatureViewOverviewTab";

import {
  useStreamFeatureViewCustomTabs,
  useStreamFeatureViewCustomTabRoutes,
} from "../../custom-tabs/TabsRegistryContext";
import { feast } from "../../protos";

interface StreamFeatureInstanceProps {
  data: feast.core.IStreamFeatureView;
}

const StreamFeatureInstance = ({ data }: StreamFeatureInstanceProps) => {
  const navigate = useNavigate();
  let { featureViewName } = useParams();

  const { customNavigationTabs } = useStreamFeatureViewCustomTabs(navigate);
  const CustomTabRoutes = useStreamFeatureViewCustomTabRoutes();

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <FeatureViewIcon />
          <Typography variant="h4" sx={{ ml: 1 }}>
            {featureViewName}
          </Typography>
        </Box>
        <Tabs
          value={useMatchExact("") ? 0 : 1}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Overview" onClick={() => navigate("")} />
          {customNavigationTabs.map((tab, index) => (
            <Tab key={index} label={tab.label} onClick={tab.onClick} />
          ))}
        </Tabs>
        <Box sx={{ mt: 3 }}>
          <Routes>
            <Route
              path="/"
              element={<StreamFeatureViewOverviewTab data={data} />}
            />
            {CustomTabRoutes}
          </Routes>
        </Box>
      </Box>
    </Container>
  );
};

export default StreamFeatureInstance;
