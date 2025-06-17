import React from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import { Container, Box, Typography, Tabs, Tab } from "@mui/material";

import { DataSourceIcon } from "../../graphics/DataSourceIcon";
import { useMatchExact } from "../../hooks/useMatchSubpath";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import DataSourceRawData from "./DataSourceRawData";
import DataSourceOverviewTab from "./DataSourceOverviewTab";

import {
  useDataSourceCustomTabs,
  useDataSourceCustomTabRoutes,
} from "../../custom-tabs/TabsRegistryContext";

const DataSourceInstance = () => {
  const navigate = useNavigate();
  let { dataSourceName } = useParams();

  useDocumentTitle(`${dataSourceName} | Data Source | Feast`);

  let tabs = [
    {
      label: "Overview",
      isSelected: useMatchExact(""),
      onClick: () => {
        navigate("");
      },
    },
  ];

  const { customNavigationTabs } = useDataSourceCustomTabs(navigate);
  tabs = tabs.concat(customNavigationTabs);

  const CustomTabRoutes = useDataSourceCustomTabRoutes();

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <DataSourceIcon />
          <Typography variant="h4" sx={{ ml: 2 }}>
            Data Source: {dataSourceName}
          </Typography>
        </Box>
        <Tabs value={tabs.findIndex(tab => tab.isSelected)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab.label} onClick={tab.onClick} />
          ))}
        </Tabs>
        <Box sx={{ mt: 3 }}>
          <Routes>
            <Route path="/" element={<DataSourceOverviewTab />} />
            <Route path="/raw-data" element={<DataSourceRawData />} />
            {CustomTabRoutes}
          </Routes>
        </Box>
      </Box>
    </Container>
  );
};

export default DataSourceInstance;
