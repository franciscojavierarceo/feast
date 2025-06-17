import React, { useContext } from "react";

import {
  Container,
  Box,
  CircularProgress,
  Stack,
  Typography,
  TextField,
} from "@mui/material";

import useLoadRegistry from "../../queries/useLoadRegistry";
import DatasourcesListingTable from "./DataSourcesListingTable";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import RegistryPathContext from "../../contexts/RegistryPathContext";
import DataSourceIndexEmptyState from "./DataSourceIndexEmptyState";
import { DataSourceIcon } from "../../graphics/DataSourceIcon";
import { useSearchQuery } from "../../hooks/useSearchInputWithTags";
import { feast } from "../../protos";
import ExportButton from "../../components/ExportButton";

const useLoadDatasources = () => {
  const registryUrl = useContext(RegistryPathContext);
  const registryQuery = useLoadRegistry(registryUrl);

  const data =
    registryQuery.data === undefined
      ? undefined
      : registryQuery.data.objects.dataSources;

  return {
    ...registryQuery,
    data,
  };
};

const filterFn = (data: feast.core.IDataSource[], searchTokens: string[]) => {
  let filteredByTags = data;

  if (searchTokens.length) {
    return filteredByTags.filter((entry) => {
      return searchTokens.find((token) => {
        return (
          token.length >= 3 && entry.name && entry.name.indexOf(token) >= 0
        );
      });
    });
  }

  return filteredByTags;
};

const Index = () => {
  const { isLoading, isSuccess, isError, data } = useLoadDatasources();

  useDocumentTitle(`Data Sources | Feast`);

  const { searchString, searchTokens, setSearchString } = useSearchQuery();

  const filterResult = data ? filterFn(data, searchTokens) : data;

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DataSourceIcon />
            <Typography variant="h4" component="h1">
              Data Sources
            </Typography>
          </Box>
          <ExportButton
            data={filterResult ?? []}
            fileName="data_sources"
            formats={["json"]}
          />
        </Box>
        
        <Box>
          {isLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size="small" />
              <Typography>Loading</Typography>
            </Box>
          )}
          {isError && <Typography>We encountered an error while loading.</Typography>}
          {isSuccess && !data && <DataSourceIndexEmptyState />}
          {isSuccess && data && data.length > 0 && filterResult && (
            <React.Fragment>
              <Stack spacing={2} sx={{ mb: 3 }}>
                <Box sx={{ flexGrow: 2 }}>
                  <Typography variant="subtitle1" component="h2" sx={{ mb: 1 }}>
                    Search
                  </Typography>
                  <TextField
                    value={searchString}
                    fullWidth
                    variant="outlined"
                    onChange={(e) => {
                      setSearchString(e.target.value);
                    }}
                  />
                </Box>
              </Stack>
              <DatasourcesListingTable dataSources={filterResult} />
            </React.Fragment>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default Index;
