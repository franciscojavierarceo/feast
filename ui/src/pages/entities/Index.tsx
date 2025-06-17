import React, { useContext } from "react";

import { Container, Box, Typography, CircularProgress } from "@mui/material";

import { EntityIcon } from "../../graphics/EntityIcon";

import useLoadRegistry from "../../queries/useLoadRegistry";
import EntitiesListingTable from "./EntitiesListingTable";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import RegistryPathContext from "../../contexts/RegistryPathContext";
import EntityIndexEmptyState from "./EntityIndexEmptyState";
import ExportButton from "../../components/ExportButton";

const useLoadEntities = () => {
  const registryUrl = useContext(RegistryPathContext);
  const registryQuery = useLoadRegistry(registryUrl);

  const data =
    registryQuery.data === undefined
      ? undefined
      : registryQuery.data.objects.entities;

  return {
    ...registryQuery,
    data,
  };
};

const Index = () => {
  const { isLoading, isSuccess, isError, data } = useLoadEntities();

  useDocumentTitle(`Entities | Feast`);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <EntityIcon />
            <Typography variant="h4" component="h1">
              Entities
            </Typography>
          </Box>
          <ExportButton
            data={data ?? []}
            fileName="entities"
            formats={["json"]}
          />
        </Box>
        <Box>
          {isLoading && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={20} />
              <Typography>Loading</Typography>
            </Box>
          )}
          {isError && <Typography>We encountered an error while loading.</Typography>}
          {isSuccess && !data && <EntityIndexEmptyState />}
          {isSuccess && data && <EntitiesListingTable entities={data} />}
        </Box>
      </Box>
    </Container>
  );
};

export default Index;
