import React from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import { Container, Box, Typography, Tabs, Tab } from "@mui/material";

import { DatasetIcon } from "../../graphics/DatasetIcon";

import { useMatchExact, useMatchSubpath } from "../../hooks/useMatchSubpath";
import DatasetOverviewTab from "./DatasetOverviewTab";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import DatasetExpectationsTab from "./DatasetExpectationsTab";
import {
  useDatasetCustomTabs,
  useDataSourceCustomTabRoutes,
} from "../../custom-tabs/TabsRegistryContext";

const DatasetInstance = () => {
  const navigate = useNavigate();
  let { datasetName } = useParams();

  useDocumentTitle(`${datasetName} | Saved Datasets | Feast`);

  const { customNavigationTabs } = useDatasetCustomTabs(navigate);
  const CustomTabRoutes = useDataSourceCustomTabRoutes();

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <DatasetIcon />
          <Typography variant="h4" sx={{ ml: 2 }}>
            Entity: {datasetName}
          </Typography>
        </Box>
        <Tabs
          value={
            useMatchExact("") ? 0 : useMatchSubpath("expectations") ? 1 : 0
          }
        >
          <Tab label="Overview" onClick={() => navigate("")} />
          <Tab label="Expectations" onClick={() => navigate("expectations")} />
          {customNavigationTabs.map((tab, index) => (
            <Tab key={index} label={tab.label} onClick={tab.onClick} />
          ))}
        </Tabs>
        <Box sx={{ mt: 3 }}>
          <Routes>
            <Route path="/" element={<DatasetOverviewTab />} />
            <Route path="/expectations" element={<DatasetExpectationsTab />} />
            {CustomTabRoutes}
          </Routes>
        </Box>
      </Box>
    </Container>
  );
};

export default DatasetInstance;
