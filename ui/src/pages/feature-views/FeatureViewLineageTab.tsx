import React, { useContext, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Alert,
  Typography,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  Stack,
} from "@mui/material";
import { feast } from "../../protos";
import useLoadRegistry from "../../queries/useLoadRegistry";
import RegistryPathContext from "../../contexts/RegistryPathContext";
import RegistryVisualization from "../../components/RegistryVisualization";
import { FEAST_FCO_TYPES } from "../../parsers/types";
import { filterPermissionsByAction } from "../../utils/permissionUtils";

interface FeatureViewLineageTabProps {
  data: feast.core.IFeatureView;
}

const FeatureViewLineageTab = ({ data }: FeatureViewLineageTabProps) => {
  const registryUrl = useContext(RegistryPathContext);
  const {
    isLoading,
    isSuccess,
    isError,
    data: registryData,
  } = useLoadRegistry(registryUrl);
  const { featureViewName } = useParams();
  const [selectedPermissionAction, setSelectedPermissionAction] = useState("");

  const filterNode = {
    type: FEAST_FCO_TYPES.featureView,
    name: featureViewName || data.spec?.name || "",
  };

  return (
    <>
      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress size="large" />
        </Box>
      )}
      {isError && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 4,
          }}
        >
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" component="h2">
              Error Loading Registry Data
            </Typography>
          </Alert>
          <Typography variant="body1">
            There was an error loading the Registry Data. Please check that{" "}
            <Typography
              component="code"
              sx={{
                fontFamily: "monospace",
                bgcolor: "grey.100",
                px: 0.5,
                borderRadius: 1,
              }}
            >
              feature_store.yaml
            </Typography>{" "}
            file is available and well-formed.
          </Typography>
        </Box>
      )}
      {isSuccess && registryData && (
        <>
          <Box sx={{ my: 3 }} />
          <Stack direction="row" sx={{ mb: 2 }}>
            <Box sx={{ flexShrink: 0, width: 300 }}>
              <FormControl fullWidth>
                <InputLabel>Filter by permissions</InputLabel>
                <Select
                  value={selectedPermissionAction}
                  onChange={(e) => setSelectedPermissionAction(e.target.value)}
                  aria-label="Filter by permissions"
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
            registryData={registryData.objects}
            relationships={registryData.relationships}
            indirectRelationships={registryData.indirectRelationships}
            permissions={
              selectedPermissionAction
                ? filterPermissionsByAction(
                    registryData.permissions,
                    selectedPermissionAction,
                  )
                : registryData.permissions
            }
            filterNode={filterNode}
          />
        </>
      )}
    </>
  );
};

export default FeatureViewLineageTab;
