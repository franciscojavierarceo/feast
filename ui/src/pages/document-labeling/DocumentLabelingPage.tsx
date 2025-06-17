import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
} from "@mui/material";
import RagTab from "./RagTab";
import ClassificationTab from "./ClassificationTab";

const DocumentLabelingPage = () => {
  const [selectedTab, setSelectedTab] = useState("rag");

  const tabs = [
    {
      id: "rag",
      name: "RAG",
      content: <RagTab />,
    },
    {
      id: "classification",
      name: "Classification",
      content: <ClassificationTab />,
    },
  ];

  const selectedTabContent = tabs.find(
    (tab) => tab.id === selectedTab,
  )?.content;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Container>
        <Box sx={{ py: 2 }}>
          <Typography variant="h4" component="h1">
            Data Labeling
          </Typography>
        </Box>

        <Box>
          <Tabs
            value={selectedTab}
            onChange={(event, newValue) => setSelectedTab(newValue)}
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                value={tab.id}
                label={tab.name}
              />
            ))}
          </Tabs>

          <Box sx={{ mt: 3 }}>
            {selectedTabContent}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default DocumentLabelingPage;
