import React from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { Container, Box, Typography, Tabs, Tab } from "@mui/material";

import { FeatureViewIcon } from "../../graphics/FeatureViewIcon";
import { useMatchExact } from "../../hooks/useMatchSubpath";
import OnDemandFeatureViewOverviewTab from "./OnDemandFeatureViewOverviewTab";

import {
  useOnDemandFeatureViewCustomTabs,
  useOnDemandFeatureViewCustomTabRoutes,
} from "../../custom-tabs/TabsRegistryContext";
import { feast } from "../../protos";

interface OnDemandFeatureInstanceProps {
  data: feast.core.IOnDemandFeatureView;
}

const OnDemandFeatureInstance = ({ data }: OnDemandFeatureInstanceProps) => {
  const navigate = useNavigate();
  let { featureViewName } = useParams();

  const { customNavigationTabs } = useOnDemandFeatureViewCustomTabs(navigate);
  const CustomTabRoutes = useOnDemandFeatureViewCustomTabRoutes();

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <FeatureViewIcon />
          <Typography variant="h4" component="h1" sx={{ ml: 2 }}>
            {featureViewName}
          </Typography>
        </Box>
        <Tabs
          value={useMatchExact("") ? 0 : -1}
          sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
        >
          <Tab label="Overview" onClick={() => navigate("")} />
          {customNavigationTabs.map((tab, index) => (
            <Tab key={index} label={tab.label} onClick={tab.onClick} />
          ))}
        </Tabs>
        <Box>
          <Routes>
            <Route
              path="/"
              element={<OnDemandFeatureViewOverviewTab data={data} />}
            />
            {CustomTabRoutes}
          </Routes>
        </Box>
      </Box>
    </Container>
  );
};

export default OnDemandFeatureInstance;
