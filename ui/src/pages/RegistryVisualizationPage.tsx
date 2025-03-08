import React from "react";
import {
  EuiPageTemplate,
  EuiTitle,
  EuiSpacer,
} from "@elastic/eui";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import RegistryVisualization from "../custom-tabs/registry-visualization/RegistryVisualization";

const RegistryVisualizationPage = () => {
  useDocumentTitle("Feast Registry Visualization");

  return (
    <EuiPageTemplate panelled>
      <EuiPageTemplate.Section>
        <EuiTitle size="l">
          <h1>Registry Visualization</h1>
        </EuiTitle>
        <EuiSpacer />
        <RegistryVisualization />
      </EuiPageTemplate.Section>
    </EuiPageTemplate>
  );
};

export default RegistryVisualizationPage;
