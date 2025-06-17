import React, { useContext } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { Container, Box, Typography, Tabs, Tab } from "@mui/material";

import { FeatureViewIcon } from "../../graphics/FeatureViewIcon";

import { useMatchExact, useMatchSubpath } from "../../hooks/useMatchSubpath";
import RegularFeatureViewOverviewTab from "./RegularFeatureViewOverviewTab";
import FeatureViewLineageTab from "./FeatureViewLineageTab";

import {
  useRegularFeatureViewCustomTabs,
  useRegularFeatureViewCustomTabRoutes,
} from "../../custom-tabs/TabsRegistryContext";
import FeatureFlagsContext from "../../contexts/FeatureFlagsContext";
import { feast } from "../../protos";

interface RegularFeatureInstanceProps {
  data: feast.core.IFeatureView;
  permissions?: any[];
}

const RegularFeatureInstance = ({
  data,
  permissions,
}: RegularFeatureInstanceProps) => {
  const { enabledFeatureStatistics } = useContext(FeatureFlagsContext);
  const navigate = useNavigate();

  const { customNavigationTabs } = useRegularFeatureViewCustomTabs(navigate);
  let tabs = [
    {
      label: "Overview",
      isSelected: useMatchExact(""),
      onClick: () => {
        navigate("");
      },
    },
  ];

  tabs.push({
    label: "Lineage",
    isSelected: useMatchSubpath("lineage"),
    onClick: () => {
      navigate("lineage");
    },
  });

  let statisticsIsSelected = useMatchSubpath("statistics");
  if (enabledFeatureStatistics) {
    tabs.push({
      label: "Statistics",
      isSelected: statisticsIsSelected,
      onClick: () => {
        navigate("statistics");
      },
    });
  }

  tabs.push(...customNavigationTabs);

  const TabRoutes = useRegularFeatureViewCustomTabRoutes();

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <FeatureViewIcon />
          <Typography variant="h4" component="h1" sx={{ ml: 1 }}>
            {data?.spec?.name}
          </Typography>
        </Box>
        <Tabs value={tabs.findIndex(tab => tab.isSelected)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              onClick={tab.onClick}
            />
          ))}
        </Tabs>
        <Box sx={{ mt: 2 }}>
          <Routes>
            <Route
              path="/"
              element={
                <RegularFeatureViewOverviewTab
                  data={data}
                  permissions={permissions}
                />
              }
            />
            <Route
              path="/lineage"
              element={<FeatureViewLineageTab data={data} />}
            />
            {TabRoutes}
          </Routes>
        </Box>
      </Box>
    </Container>
  );
};

export default RegularFeatureInstance;
