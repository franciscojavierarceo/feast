import React, { useContext } from "react";

import {
  Container,
  Box,
  CircularProgress,
  Typography,
  Stack,
  TextField,
} from "@mui/material";

import { FeatureServiceIcon } from "../../graphics/FeatureServiceIcon";

import useLoadRegistry from "../../queries/useLoadRegistry";
import FeatureServiceListingTable from "./FeatureServiceListingTable";
import {
  useSearchQuery,
  useTagsWithSuggestions,
  filterInputInterface,
  tagTokenGroupsType,
} from "../../hooks/useSearchInputWithTags";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import RegistryPathContext from "../../contexts/RegistryPathContext";
import FeatureServiceIndexEmptyState from "./FeatureServiceIndexEmptyState";
import TagSearch from "../../components/TagSearch";
import ExportButton from "../../components/ExportButton";
import { useFeatureServiceTagsAggregation } from "../../hooks/useTagsAggregation";
import { feast } from "../../protos";

const useLoadFeatureServices = () => {
  const registryUrl = useContext(RegistryPathContext);
  const registryQuery = useLoadRegistry(registryUrl);

  const data =
    registryQuery.data === undefined
      ? undefined
      : registryQuery.data.objects.featureServices;

  return {
    ...registryQuery,
    data,
  };
};

const shouldIncludeFSsGivenTokenGroups = (
  entry: feast.core.IFeatureService,
  tagTokenGroups: tagTokenGroupsType,
) => {
  return Object.entries(tagTokenGroups).every(([key, values]) => {
    const entryTagValue = entry?.spec?.tags ? entry.spec.tags[key] : undefined;

    if (entryTagValue) {
      return values.every((value) => {
        return value.length > 0 ? entryTagValue.indexOf(value) >= 0 : true; // Don't filter if the string is empty
      });
    } else {
      return false;
    }
  });
};

const filterFn = (
  data: feast.core.IFeatureService[],
  filterInput: filterInputInterface,
) => {
  let filteredByTags = data;

  if (Object.keys(filterInput.tagTokenGroups).length) {
    filteredByTags = data.filter((entry) => {
      return shouldIncludeFSsGivenTokenGroups(
        entry,
        filterInput.tagTokenGroups,
      );
    });
  }

  if (filterInput.searchTokens.length) {
    return filteredByTags.filter((entry) => {
      return filterInput.searchTokens.find((token) => {
        return token.length >= 3 && entry?.spec?.name?.indexOf(token)! >= 0;
      });
    });
  }

  return filteredByTags;
};

const Index = () => {
  const { isLoading, isSuccess, isError, data } = useLoadFeatureServices();
  const tagAggregationQuery = useFeatureServiceTagsAggregation();

  useDocumentTitle(`Feature Services | Feast`);

  const { searchString, searchTokens, setSearchString } = useSearchQuery();

  const {
    currentTag,
    tagsString,
    tagTokenGroups,
    tagKeysSet,
    tagSuggestions,
    suggestionMode,
    setTagsString,
    acceptSuggestion,
    setCursorPosition,
  } = useTagsWithSuggestions(tagAggregationQuery.data);

  const filterResult = data
    ? filterFn(data, { tagTokenGroups, searchTokens })
    : data;

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <FeatureServiceIcon />
          <Typography variant="h4" component="h1">
            Feature Services
          </Typography>
          <Box sx={{ ml: "auto" }}>
            <ExportButton
              data={filterResult ?? []}
              fileName="feature_services"
              formats={["json"]}
            />
          </Box>
        </Stack>
      </Box>
      <Box>
        {isLoading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size="medium" />
            <Typography>Loading</Typography>
          </Box>
        )}
        {isError && (
          <Typography>We encountered an error while loading.</Typography>
        )}
        {isSuccess && !data && <FeatureServiceIndexEmptyState />}
        {isSuccess && filterResult && (
          <React.Fragment>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
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
              <Box sx={{ flexGrow: 3 }}>
                <TagSearch
                  currentTag={currentTag}
                  tagsString={tagsString}
                  setTagsString={setTagsString}
                  acceptSuggestion={acceptSuggestion}
                  tagSuggestions={tagSuggestions}
                  suggestionMode={suggestionMode}
                  setCursorPosition={setCursorPosition}
                />
              </Box>
            </Stack>
            <FeatureServiceListingTable
              featureServices={filterResult}
              tagKeysSet={tagKeysSet}
            />
          </React.Fragment>
        )}
      </Box>
    </Container>
  );
};

export default Index;
