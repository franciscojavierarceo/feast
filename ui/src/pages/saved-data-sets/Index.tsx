import React, { useContext } from "react";

import { Container, Box, Typography, CircularProgress } from "@mui/material";

import { DatasetIcon } from "../../graphics/DatasetIcon";

import useLoadRegistry from "../../queries/useLoadRegistry";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import RegistryPathContext from "../../contexts/RegistryPathContext";
import DatasetsListingTable from "./DatasetsListingTable";
import DatasetsIndexEmptyState from "./DatasetsIndexEmptyState";

const useLoadSavedDataSets = () => {
  const registryUrl = useContext(RegistryPathContext);
  const registryQuery = useLoadRegistry(registryUrl);

  const data =
    registryQuery.data === undefined
      ? undefined
      : registryQuery.data.objects.savedDatasets;

  return {
    ...registryQuery,
    data,
  };
};

const Index = () => {
  const { isLoading, isSuccess, isError, data } = useLoadSavedDataSets();

  useDocumentTitle(`Saved Datasets | Feast`);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <DatasetIcon />
          <Typography variant="h4" component="h1" sx={{ ml: 2 }}>
            Datasets
          </Typography>
        </Box>
        <Box>
          {isLoading && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={24} />
              <Typography>Loading</Typography>
            </Box>
          )}
          {isError && <Typography>We encountered an error while loading.</Typography>}
          {isSuccess && data && <DatasetsListingTable datasets={data} />}
          {isSuccess && !data && <DatasetsIndexEmptyState />}
        </Box>
      </Box>
    </Container>
  );
};

export default Index;
