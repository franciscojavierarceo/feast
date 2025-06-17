import React from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import { Container, Box, Typography, Tabs, Tab } from "@mui/material";

import { FeatureIcon } from "../../graphics/FeatureIcon";
import { useMatchExact } from "../../hooks/useMatchSubpath";
import FeatureOverviewTab from "./FeatureOverviewTab";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import {
  useFeatureCustomTabs,
  useFeatureCustomTabRoutes,
} from "../../custom-tabs/TabsRegistryContext";

const FeatureInstance = () => {
  const navigate = useNavigate();
  let { FeatureViewName, FeatureName } = useParams();

  const { customNavigationTabs } = useFeatureCustomTabs(navigate);
  const CustomTabRoutes = useFeatureCustomTabRoutes();

  useDocumentTitle(`${FeatureName} | ${FeatureViewName} | Feast`);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <FeatureIcon />
          <Typography variant="h4" component="h1" sx={{ ml: 2 }}>
            Feature: {FeatureName}
          </Typography>
        </Box>
        <Tabs value={useMatchExact("") ? 0 : -1} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab 
            label="Overview" 
            onClick={() => navigate("")}
          />
          {customNavigationTabs.map((tab, index) => (
            <Tab 
              key={index + 1}
              label={tab.label}
              onClick={tab.onClick}
            />
          ))}
        </Tabs>
        <Box sx={{ mt: 3 }}>
          <Routes>
            <Route path="/" element={<FeatureOverviewTab />} />
            {CustomTabRoutes}
          </Routes>
        </Box>
      </Box>
    </Container>
  );
};

export default FeatureInstance;
