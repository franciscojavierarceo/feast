import React, { useEffect, useState } from "react";
import {
  EuiPageTemplate,
  EuiTabs,
  EuiTab,
  EuiSpacer,
  EuiTitle,
  EuiText,
  EuiSkeletonText,
} from "@elastic/eui";
import { useParams, useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import CLIDocumentation from "./CLIDocumentation";
import SDKDocumentation from "./SDKDocumentation";
import APIDocumentation from "./APIDocumentation";
import "./styles.css";

const DocumentationIndex = () => {
  useDocumentTitle("Feast Documentation");
  const { projectName, tab } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("cli");

  useEffect(() => {
    if (tab && ["cli", "sdk", "api"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [tab]);

  const tabs = [
    {
      id: "cli",
      name: "CLI Reference",
    },
    {
      id: "sdk",
      name: "SDK Reference",
    },
    {
      id: "api",
      name: "API Reference",
    },
  ];

  const onSelectedTabChanged = (id: string) => {
    setActiveTab(id);
    navigate(`/p/${projectName}/documentation/${id}`);
  };

  const renderTabs = () => {
    return tabs.map((tabItem, index) => (
      <EuiTab
        key={index}
        onClick={() => onSelectedTabChanged(tabItem.id)}
        isSelected={tabItem.id === activeTab}
      >
        {tabItem.name}
      </EuiTab>
    ));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "cli":
        return <CLIDocumentation />;
      case "sdk":
        return <SDKDocumentation />;
      case "api":
        return <APIDocumentation />;
      default:
        return <CLIDocumentation />;
    }
  };

  return (
    <EuiPageTemplate panelled>
      <EuiPageTemplate.Section>
        <EuiTitle size="l">
          <h1>Feast Documentation</h1>
        </EuiTitle>
        <EuiText>
          <p>Documentation for the Feast SDK, REST API, and CLI.</p>
        </EuiText>
        <EuiSpacer size="m" />
        <EuiTabs>{renderTabs()}</EuiTabs>
        <EuiSpacer size="m" />
        {renderTabContent()}
      </EuiPageTemplate.Section>
    </EuiPageTemplate>
  );
};

export default DocumentationIndex;
