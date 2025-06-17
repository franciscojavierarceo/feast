import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  Stack,
  Box,
  Typography,
  Divider,
  Chip,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Search } from "@mui/icons-material";

const commandPaletteStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    width: "600px",
    maxWidth: "90vw",
    maxHeight: "80vh",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    padding: "16px",
    borderBottom: "1px solid #D3DAE6",
    position: "sticky",
    top: 0,
    backgroundColor: "white",
    zIndex: 1,
  },
  modalBody: {
    padding: "0 16px 16px",
    maxHeight: "calc(80vh - 60px)",
    overflowY: "auto",
  },
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

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  categories: {
    name: string;
    data: any[];
    getLink: (item: any) => string;
  }[];
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

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  categories,
}) => {
  const [searchText, setSearchText] = React.useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSearchText("");
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

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

  console.log(
    "CommandPalette isOpen:",
    isOpen,
    "categories:",
    categories.length,
  ); // Debug log

  if (!isOpen) {
    console.log("CommandPalette not rendering due to isOpen=false");
    return null;
  }

  return (
    <div style={commandPaletteStyles.overlay} onClick={onClose}>
      <div
        style={commandPaletteStyles.modal}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div style={commandPaletteStyles.modalHeader}>
          <h2 style={{ margin: 0 }}>Search Registry</h2>
        </div>
        <div style={commandPaletteStyles.modalBody}>
          <TextField
            placeholder="Search across Feature Views, Features, Entities, etc."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            fullWidth
            inputRef={inputRef}
            aria-label="Search registry"
            autoFocus
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ my: 1 }} />
          {searchText ? (
            <div style={commandPaletteStyles.searchResults}>
              {searchResults.filter((result) => result.items.length > 0)
                .length > 0 ? (
                searchResults
                  .filter((result) => result.items.length > 0)
                  .map((result) => (
                    <div
                      key={result.title}
                      style={commandPaletteStyles.categoryGroup}
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
                                ? commandPaletteStyles.searchResultItemLast
                                : commandPaletteStyles.searchResultItem
                            }
                          >
                            <Stack
                              direction="row"
                              spacing={2}
                              alignItems="flex-start"
                            >
                              <Box sx={{ flexGrow: 1 }}>
                                <a
                                  href={item.link}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    console.log(
                                      "Search result clicked:",
                                      item.name,
                                    );

                                    onClose();

                                    setSearchText("");

                                    console.log("Navigating to:", item.link);
                                    navigate(item.link);
                                  }}
                                  style={{
                                    color: "#0077cc",
                                    textDecoration: "none",
                                  }}
                                >
                                  <strong>{item.name}</strong>
                                </a>
                                {item.description && (
                                  <div
                                    style={commandPaletteStyles.itemDescription}
                                  >
                                    {item.description}
                                  </div>
                                )}
                              </Box>
                              {item.type && (
                                <Box sx={{ flexShrink: 0 }}>
                                  <Chip
                                    label={item.type}
                                    size="small"
                                    variant="filled"
                                  />
                                </Box>
                              )}
                            </Stack>
                          </div>
                        ))}
                      </Paper>
                      <Box sx={{ my: 2 }} />
                    </div>
                  ))
              ) : (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.100" }}>
                  <Typography variant="body1" textAlign="center">
                    No matches found for "{searchText}"
                  </Typography>
                </Paper>
              )}
            </div>
          ) : (
            <Typography
              variant="body1"
              color="text.secondary"
              textAlign="center"
            >
              Start typing to search...
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
