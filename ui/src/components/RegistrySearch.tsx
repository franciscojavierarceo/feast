import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Paper, Stack, Box, Typography, Divider, Chip, TextField, InputAdornment } from "@mui/material";
import { Search } from "@mui/icons-material";
import CustomLink from "./CustomLink";

import { css } from "@emotion/react";

const searchResultsStyles = {
  searchResults: {
    marginTop: "8px",
  },
  categoryGroup: {
    marginBottom: "8px",
  },
  searchResultItem: {
    padding: "8px 0",
    borderBottom: "1px solid #eee",
  },
  searchResultItemLast: {
    padding: "8px 0",
    borderBottom: "none",
  },
  itemDescription: {
    fontSize: "0.85em",
    color: "#666",
    marginTop: "4px",
  },
};

interface RegistrySearchProps {
  categories: {
    name: string;
    data: any[];
    getLink: (item: any) => string;
  }[];
}

export interface RegistrySearchRef {
  focusSearchInput: () => void;
}

const getItemType = (item: any, category: string): string | undefined => {
  if (category === "Features" && "valueType" in item) {
    return item.valueType;
  }
  if (category === "Feature Views" && "type" in item) {
    return item.type;
  }
  return undefined;
};

const RegistrySearch = forwardRef<RegistrySearchRef, RegistrySearchProps>(
  ({ categories }, ref) => {
    const [searchText, setSearchText] = useState("");
    const inputRef = useRef<HTMLInputElement | null>(null);

    const focusSearchInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    useImperativeHandle(
      ref,
      () => ({
        focusSearchInput,
      }),
      [focusSearchInput],
    );

    const searchResults = categories.map(({ name, data, getLink }) => {
      const filteredItems = searchText
        ? data.filter((item) => {
            const itemName =
              "name" in item
                ? String(item.name)
                : "spec" in item && item.spec && "name" in item.spec
                  ? String(item.spec.name ?? "Unknown")
                  : "Unknown";

            return itemName.toLowerCase().includes(searchText.toLowerCase());
          })
        : [];

      const items = filteredItems.map((item) => {
        const itemName =
          "name" in item
            ? String(item.name)
            : "spec" in item && item.spec && "name" in item.spec
              ? String(item.spec.name ?? "Unknown")
              : "Unknown";

        return {
          name: itemName,
          link: getLink(item),
          description:
            "spec" in item && item.spec && "description" in item.spec
              ? String(item.spec.description || "")
              : "",
          type: getItemType(item, name),
        };
      });

      return {
        title: name,
        items,
      };
    });

    return (
      <>
        <TextField
          placeholder="Search across Feature Views, Features, Entities, etc."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          fullWidth
          inputRef={inputRef}
          aria-label="Search registry"
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Typography variant="caption" color="text.secondary">
                  <span style={{ whiteSpace: "nowrap" }}>⌘K</span>
                </Typography>
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ my: 1 }} />
        {searchText && (
          <div style={searchResultsStyles.searchResults}>
            <Typography variant="h6" component="h4">
              Search Results
            </Typography>
            <Box sx={{ my: 0.5 }} />
            {searchResults.filter((result) => result.items.length > 0).length >
            0 ? (
              searchResults
                .filter((result) => result.items.length > 0)
                .map((result) => (
                  <div
                    key={result.title}
                    style={searchResultsStyles.categoryGroup}
                  >
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" component="h3">
                        {result.title} ({result.items.length})
                      </Typography>
                      <Divider sx={{ my: 0.5 }} />
                      {result.items.map((item, idx) => (
                        <div
                          key={item.name}
                          style={
                            idx === result.items.length - 1
                              ? searchResultsStyles.searchResultItemLast
                              : searchResultsStyles.searchResultItem
                          }
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <div style={{ flexGrow: 1 }}>
                              <CustomLink
                                to={item.link}
                                onClick={() => setSearchText("")}
                              >
                                <strong>{item.name}</strong>
                              </CustomLink>
                              {item.description && (
                                <div
                                  style={searchResultsStyles.itemDescription}
                                >
                                  {item.description}
                                </div>
                              )}
                            </div>
                            {item.type && (
                              <div style={{ flexShrink: 0 }}>
                                <Chip label={item.type} size="small" />
                              </div>
                            )}
                          </Stack>
                        </div>
                      ))}
                    </Paper>
                    <Box sx={{ my: 2 }} />
                  </div>
                ))
            ) : (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Typography variant="body1" textAlign="center">
                  No matches found for "{searchText}"
                </Typography>
              </Paper>
            )}
          </div>
        )}
      </>
    );
  },
);

export default RegistrySearch;
