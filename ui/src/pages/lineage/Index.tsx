import React, { useContext } from "react";
import {
  Container,
  Box,
  Typography,
  Skeleton,
  Alert,
} from "@mui/material";

import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import useLoadRegistry from "../../queries/useLoadRegistry";
import RegistryPathContext from "../../contexts/RegistryPathContext";
import RegistryVisualizationTab from "../../components/RegistryVisualizationTab";
import { useParams } from "react-router-dom";

const LineagePage = () => {
  useDocumentTitle("Feast Lineage");
  const registryUrl = useContext(RegistryPathContext);
  const { isLoading, isSuccess, isError, data } = useLoadRegistry(registryUrl);
  const { projectName } = useParams<{ projectName: string }>();

  return (
    <Container maxWidth="xl">
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isLoading && <Skeleton width="60%" />}
          {isSuccess && data?.project && `${data.project} Lineage`}
        </Typography>

        {isError && (
          <Alert 
            severity="error" 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textAlign: 'center',
              p: 4 
            }}
          >
            <Typography variant="h6" component="h2" gutterBottom>
              Error Loading Project Configs
            </Typography>
            <Typography variant="body1">
              There was an error loading the Project Configurations. Please
              check that <code>feature_store.yaml</code> file is available and
              well-formed.
            </Typography>
          </Alert>
        )}

        {isSuccess && <RegistryVisualizationTab />}
      </Box>
    </Container>
  );
};

export default LineagePage;
