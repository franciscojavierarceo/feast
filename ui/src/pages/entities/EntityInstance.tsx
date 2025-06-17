import React from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import { Container, Box, Tabs, Tab } from "@mui/material";

import { EntityIcon } from "../../graphics/EntityIcon";
import { useMatchExact } from "../../hooks/useMatchSubpath";
import EntityOverviewTab from "./EntityOverviewTab";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import {
  useEntityCustomTabs,
  useEntityCustomTabRoutes,
} from "../../custom-tabs/TabsRegistryContext";

const EntityInstance = () => {
  const navigate = useNavigate();
  let { entityName } = useParams();

  const { customNavigationTabs } = useEntityCustomTabs(navigate);
  const CustomTabRoutes = useEntityCustomTabRoutes();

  useDocumentTitle(`${entityName} | Entity | Feast`);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <EntityIcon />
          <Box sx={{ ml: 2, fontSize: "1.5rem", fontWeight: 600 }}>
            Entity: {entityName}
          </Box>
        </Box>
        <Tabs value={useMatchExact("") ? 0 : 1}>
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
            <Route path="/" element={<EntityOverviewTab />} />
            {CustomTabRoutes}
          </Routes>
        </Box>
      </Box>
    </Container>
  );
};

export default EntityInstance;
