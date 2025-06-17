import React, { useContext, useState } from "react";
import {
  Box,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Typography,
  Alert,
} from "@mui/material";
import useLoadRegistry from "../queries/useLoadRegistry";
import RegistryPathContext from "../contexts/RegistryPathContext";
import RegistryVisualization from "./RegistryVisualization";
import { FEAST_FCO_TYPES } from "../parsers/types";
import { filterPermissionsByAction } from "../utils/permissionUtils";

const RegistryVisualizationTab = () => {
  const registryUrl = useContext(RegistryPathContext);
  const { isLoading, isSuccess, isError, data } = useLoadRegistry(registryUrl);
  const [selectedObjectType, setSelectedObjectType] = useState("");
  const [selectedObjectName, setSelectedObjectName] = useState("");
  const [selectedPermissionAction, setSelectedPermissionAction] = useState("");

  const getObjectOptions = (objects: any, type: string) => {
    switch (type) {
      case "dataSource":
        const dataSources = new Set<string>();
        objects.featureViews?.forEach((fv: any) => {
          if (fv.spec?.batchSource?.name)
            dataSources.add(fv.spec.batchSource.name);
        });
        objects.streamFeatureViews?.forEach((sfv: any) => {
          if (sfv.spec?.batchSource?.name)
            dataSources.add(sfv.spec.batchSource.name);
          if (sfv.spec?.streamSource?.name)
            dataSources.add(sfv.spec.streamSource.name);
        });
        return Array.from(dataSources);
      case "entity":
        return objects.entities?.map((entity: any) => entity.spec?.name) || [];
      case "featureView":
        return [
          ...(objects.featureViews?.map((fv: any) => fv.spec?.name) || []),
          ...(objects.onDemandFeatureViews?.map(
            (odfv: any) => odfv.spec?.name,
          ) || []),
          ...(objects.streamFeatureViews?.map((sfv: any) => sfv.spec?.name) ||
            []),
        ];
      case "featureService":
        return objects.featureServices?.map((fs: any) => fs.spec?.name) || [];
      default:
        return [];
    }
  };

  return (
    <>
      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress size={60} />
        </Box>
      )}
      {isError && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" component="h2">
              Error Loading Registry Data
            </Typography>
          </Alert>
          <Typography variant="body1">
            There was an error loading the Registry Data. Please check that{" "}
            <Typography component="code" sx={{ fontFamily: "monospace", bgcolor: "grey.100", px: 0.5, borderRadius: 1 }}>
              feature_store.yaml
            </Typography>{" "}
            file is available and well-formed.
          </Typography>
        </Box>
      )}
      {isSuccess && data && (
        <>
          <Box sx={{ my: 3 }} />
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Box sx={{ flexShrink: 0, width: 200 }}>
              <FormControl fullWidth>
                <InputLabel>Filter by type</InputLabel>
                <Select
                  value={selectedObjectType}
                  onChange={(e) => {
                    setSelectedObjectType(e.target.value);
                    setSelectedObjectName(""); // Reset name when type changes
                  }}
                  label="Filter by type"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="dataSource">Data Source</MenuItem>
                  <MenuItem value="entity">Entity</MenuItem>
                  <MenuItem value="featureView">Feature View</MenuItem>
                  <MenuItem value="featureService">Feature Service</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flexShrink: 0, width: 300 }}>
              <FormControl fullWidth>
                <InputLabel>Select object</InputLabel>
                <Select
                  value={selectedObjectName}
                  onChange={(e) => setSelectedObjectName(e.target.value)}
                  label="Select object"
                  disabled={selectedObjectType === ""}
                >
                  <MenuItem value="">All</MenuItem>
                  {getObjectOptions(data.objects, selectedObjectType).map(
                    (name: string) => (
                      <MenuItem key={name} value={name}>
                        {name}
                      </MenuItem>
                    ),
                  )}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flexShrink: 0, width: 300 }}>
              <FormControl fullWidth>
                <InputLabel>Filter by permissions</InputLabel>
                <Select
                  value={selectedPermissionAction}
                  onChange={(e) => setSelectedPermissionAction(e.target.value)}
                  label="Filter by permissions"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="CREATE">CREATE</MenuItem>
                  <MenuItem value="DESCRIBE">DESCRIBE</MenuItem>
                  <MenuItem value="UPDATE">UPDATE</MenuItem>
                  <MenuItem value="DELETE">DELETE</MenuItem>
                  <MenuItem value="READ_ONLINE">READ_ONLINE</MenuItem>
                  <MenuItem value="READ_OFFLINE">READ_OFFLINE</MenuItem>
                  <MenuItem value="WRITE_ONLINE">WRITE_ONLINE</MenuItem>
                  <MenuItem value="WRITE_OFFLINE">WRITE_OFFLINE</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Stack>
          <RegistryVisualization
            registryData={data.objects}
            relationships={data.relationships}
            indirectRelationships={data.indirectRelationships}
            permissions={
              selectedPermissionAction
                ? filterPermissionsByAction(
                    data.permissions,
                    selectedPermissionAction,
                  )
                : data.permissions
            }
            filterNode={
              selectedObjectType && selectedObjectName
                ? {
                    type: selectedObjectType as FEAST_FCO_TYPES,
                    name: selectedObjectName,
                  }
                : undefined
            }
          />
        </>
      )}
    </>
  );
};

export default RegistryVisualizationTab;
