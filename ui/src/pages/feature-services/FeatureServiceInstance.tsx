import React from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import { Container, Box, Typography, Tabs, Tab } from "@mui/material";

import { FeatureServiceIcon } from "../../graphics/FeatureServiceIcon";
import { useMatchExact } from "../../hooks/useMatchSubpath";
import FeatureServiceOverviewTab from "./FeatureServiceOverviewTab";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

import {
  useFeatureServiceCustomTabs,
  useFeatureServiceCustomTabRoutes,
} from "../../custom-tabs/TabsRegistryContext";

const FeatureServiceInstance = () => {
  const navigate = useNavigate();
  let { featureServiceName } = useParams();

  useDocumentTitle(`${featureServiceName} | Feature Service | Feast`);

  const { customNavigationTabs } = useFeatureServiceCustomTabs(navigate);
  const CustomTabRoutes = useFeatureServiceCustomTabRoutes();

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <FeatureServiceIcon />
          <Typography variant="h4" component="h1" sx={{ ml: 2 }}>
            Feature Service: {featureServiceName}
          </Typography>
        </Box>
        <Tabs value={useMatchExact("") ? 0 : 1} sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tab
            label="Overview"
            onClick={() => navigate("")}
          />
          {customNavigationTabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              onClick={tab.onClick}
            />
          ))}
        </Tabs>
        <Box sx={{ mt: 3 }}>
          <Routes>
            <Route path="/" element={<FeatureServiceOverviewTab />} />
            {CustomTabRoutes}
          </Routes>
        </Box>
      </Box>
    </Container>
  );
};

export default FeatureServiceInstance;
