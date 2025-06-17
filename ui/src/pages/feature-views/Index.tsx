import React, { useContext } from "react";

import {
  Container,
  Box,
  CircularProgress,
  Typography,
  TextField,
  Stack,
} from "@mui/material";

import { FeatureViewIcon } from "../../graphics/FeatureViewIcon";

import useLoadRegistry from "../../queries/useLoadRegistry";
import FeatureViewListingTable from "./FeatureViewListingTable";
import {
  filterInputInterface,
  useSearchQuery,
  useTagsWithSuggestions,
} from "../../hooks/useSearchInputWithTags";
import { genericFVType, regularFVInterface } from "../../parsers/mergedFVTypes";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import RegistryPathContext from "../../contexts/RegistryPathContext";
import FeatureViewIndexEmptyState from "./FeatureViewIndexEmptyState";
import { useFeatureViewTagsAggregation } from "../../hooks/useTagsAggregation";
import TagSearch from "../../components/TagSearch";
import ExportButton from "../../components/ExportButton";

const useLoadFeatureViews = () => {
  const registryUrl = useContext(RegistryPathContext);
  const registryQuery = useLoadRegistry(registryUrl);

  const data =
    registryQuery.data === undefined
      ? undefined
      : registryQuery.data.mergedFVList;

  return {
    ...registryQuery,
    data,
  };
};

const shouldIncludeFVsGivenTokenGroups = (
  entry: regularFVInterface,
  tagTokenGroups: Record<string, string[]>,
) => {
  return Object.entries(tagTokenGroups).every(([key, values]) => {
    const entryTagValue = entry?.object?.spec!.tags
      ? entry.object.spec.tags[key]
      : undefined;

    if (entryTagValue) {
      return values.every((value) => {
        return value.length > 0 ? entryTagValue.indexOf(value) >= 0 : true; // Don't filter if the string is empty
      });
    } else {
      return false;
    }
  });
};

const filterFn = (data: genericFVType[], filterInput: filterInputInterface) => {
  let filteredByTags = data;

  if (Object.keys(filterInput.tagTokenGroups).length) {
    filteredByTags = data.filter((entry) => {
      if (entry.type === "regular") {
        return shouldIncludeFVsGivenTokenGroups(
          entry,
          filterInput.tagTokenGroups,
        );
      } else {
        return false; // ODFVs don't have tags yet
      }
    });
  }

  if (filterInput.searchTokens.length) {
    return filteredByTags.filter((entry) => {
      return filterInput.searchTokens.find((token) => {
        return token.length >= 3 && entry.name.indexOf(token) >= 0;
      });
    });
  }

  return filteredByTags;
};

const Index = () => {
  const { isLoading, isSuccess, isError, data } = useLoadFeatureViews();
  const tagAggregationQuery = useFeatureViewTagsAggregation();

  useDocumentTitle(`Feature Views | Feast`);

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
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FeatureViewIcon />
          <Typography variant="h4" component="h1">
            Feature Views
          </Typography>
        </Box>
        <ExportButton
          data={filterResult ?? []}
          fileName="feature_views"
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
        {isSuccess && data?.length === 0 && <FeatureViewIndexEmptyState />}
        {isSuccess && data && data.length > 0 && filterResult && (
          <React.Fragment>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Box sx={{ flexGrow: 2 }}>
                <Typography variant="subtitle2" component="h2" sx={{ mb: 1 }}>
                  Search
                </Typography>
                <TextField
                  value={searchString}
                  fullWidth
                  variant="outlined"
                  size="small"
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
            <FeatureViewListingTable
              tagKeysSet={tagKeysSet}
              featureViews={filterResult}
            />
          </React.Fragment>
        )}
      </Box>
    </Container>
  );
};

export default Index;
