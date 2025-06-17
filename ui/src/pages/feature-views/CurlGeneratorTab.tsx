import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Divider,
  Box,
  Button,
  Stack,
  FormControl,
  InputLabel,
  TextField,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { ContentCopy } from "@mui/icons-material";
import { CodeBlock, github } from "react-code-blocks";
import { RegularFeatureViewCustomTabProps } from "../../custom-tabs/types";

const CurlGeneratorTab = ({
  feastObjectQuery,
}: RegularFeatureViewCustomTabProps) => {
  const data = feastObjectQuery.data as any;
  const [serverUrl, setServerUrl] = useState(() => {
    const savedUrl = localStorage.getItem("feast-feature-server-url");
    return savedUrl || "http://localhost:6566";
  });
  const [entityValues, setEntityValues] = useState<Record<string, string>>({});
  const [selectedFeatures, setSelectedFeatures] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    localStorage.setItem("feast-feature-server-url", serverUrl);
  }, [serverUrl]);

  if (feastObjectQuery.isLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (feastObjectQuery.isError || !data) {
    return <Typography>Error loading feature view data.</Typography>;
  }

  const generateFeatureNames = () => {
    if (!data?.name || !data?.features) return [];

    return data.features
      .filter((feature: any) => selectedFeatures[feature.name] !== false)
      .map((feature: any) => `${data.name}:${feature.name}`);
  };

  const generateEntityObject = () => {
    if (!data?.object?.spec?.entities) return {};

    const entities: Record<string, number[]> = {};
    data.object.spec.entities.forEach((entityName: string) => {
      const userValue = entityValues[entityName];
      if (userValue) {
        const values = userValue.split(",").map((v) => {
          const num = parseInt(v.trim());
          return isNaN(num) ? 1001 : num;
        });
        entities[entityName] = values;
      } else {
        entities[entityName] = [1001, 1002, 1003];
      }
    });
    return entities;
  };

  const generateCurlCommand = () => {
    const features = generateFeatureNames();
    const entities = generateEntityObject();

    const payload = {
      features,
      entities,
    };

    const curlCommand = `curl -X POST \\
  "${serverUrl}/get-online-features" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2)}'`;

    return curlCommand;
  };

  const curlCommand = generateCurlCommand();

  return (
    <React.Fragment>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" component="h2">
          Feature Server CURL Generator
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Generate a CURL command to fetch online features from the feature
          server. The command is pre-populated with all features and entities
          from this feature view.
        </Typography>
        <Box sx={{ mt: 2 }} />

        <FormControl fullWidth>
          <TextField
            label="Feature Server URL"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="http://localhost:6566"
            variant="outlined"
          />
        </FormControl>

        <Box sx={{ mt: 2 }} />

        {data?.features && data.features.length > 0 && (
          <>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box sx={{ flexShrink: 0 }}>
                <Typography variant="subtitle2" component="h3">
                  Features to Include (
                  {
                    Object.values(selectedFeatures).filter((v) => v !== false)
                      .length
                  }
                  /{data.features.length})
                </Typography>
              </Box>
              <Box sx={{ flexShrink: 0 }}>
                <Stack direction="row" spacing={1}>
                  <Box sx={{ flexShrink: 0 }}>
                    <Button
                      size="small"
                      onClick={() => {
                        const allSelected: Record<string, boolean> = {};
                        data.features.forEach((feature: any) => {
                          allSelected[feature.name] = true;
                        });
                        setSelectedFeatures(allSelected);
                      }}
                    >
                      Select All
                    </Button>
                  </Box>
                  <Box sx={{ flexShrink: 0 }}>
                    <Button
                      size="small"
                      onClick={() => {
                        const noneSelected: Record<string, boolean> = {};
                        data.features.forEach((feature: any) => {
                          noneSelected[feature.name] = false;
                        });
                        setSelectedFeatures(noneSelected);
                      }}
                    >
                      Select None
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </Stack>
            <Box sx={{ my: 1 }} />
            <Paper variant="outlined" sx={{ p: 1, bgcolor: "grey.50" }}>
              {Array.from(
                { length: Math.ceil(data.features.length / 5) },
                (_, rowIndex) => (
                  <Stack
                    key={rowIndex}
                    direction="row"
                    spacing={1}
                    sx={{
                      mb:
                        rowIndex < Math.ceil(data.features.length / 5) - 1
                          ? 1
                          : 0,
                    }}
                  >
                    {data.features
                      .slice(rowIndex * 5, (rowIndex + 1) * 5)
                      .map((feature: any) => (
                        <Box
                          key={feature.name}
                          sx={{ flexShrink: 0, minWidth: "180px" }}
                        >
                          <FormControlLabel
                            control={
                              <Checkbox
                                id={`feature-${feature.name}`}
                                checked={
                                  selectedFeatures[feature.name] !== false
                                }
                                onChange={(e) =>
                                  setSelectedFeatures((prev) => ({
                                    ...prev,
                                    [feature.name]: e.target.checked,
                                  }))
                                }
                                color="primary"
                              />
                            }
                            label={feature.name}
                          />
                        </Box>
                      ))}
                  </Stack>
                ),
              )}
            </Paper>
            <Box sx={{ my: 2 }} />
          </>
        )}

        {data?.object?.spec?.entities &&
          data.object.spec.entities.length > 0 && (
            <>
              <Typography variant="subtitle2" component="h3">
                Entity Values (comma-separated)
              </Typography>
              <Box sx={{ my: 1 }} />
              {data.object.spec.entities.map((entityName: string) => (
                <FormControl key={entityName} fullWidth sx={{ mb: 2 }}>
                  <TextField
                    label={entityName}
                    value={entityValues[entityName] || ""}
                    onChange={(e) =>
                      setEntityValues((prev) => ({
                        ...prev,
                        [entityName]: e.target.value,
                      }))
                    }
                    placeholder="1001, 1002, 1003"
                    variant="outlined"
                  />
                </FormControl>
              ))}
              <Box sx={{ my: 2 }} />
            </>
          )}

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box sx={{ flexShrink: 0 }}>
            <Typography variant="subtitle2" component="h3">
              Generated CURL Command
            </Typography>
          </Box>
          <Box sx={{ flexShrink: 0 }}>
            <Button
              onClick={() => navigator.clipboard.writeText(curlCommand)}
              size="small"
              startIcon={<ContentCopy />}
            >
              Copy to Clipboard
            </Button>
          </Box>
        </Stack>

        <Box sx={{ my: 1 }} />

        <CodeBlock
          text={curlCommand}
          language="bash"
          showLineNumbers={false}
          theme={github}
        />

        <Box sx={{ my: 2 }} />

        <Typography variant="body2" color="text.secondary">
          <p>
            <strong>Features included:</strong>{" "}
            {generateFeatureNames().join(", ")}
          </p>
          {data?.object?.spec?.entities && (
            <p>
              <strong>Entities:</strong> {data.object.spec.entities.join(", ")}
            </p>
          )}
        </Typography>
      </Paper>
    </React.Fragment>
  );
};

export default CurlGeneratorTab;
