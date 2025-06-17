import React from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Stack,
  CircularProgress,
  Divider,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
} from "@mui/material";
import { useContext, useState } from "react";
import RegistryPathContext from "../../contexts/RegistryPathContext";
import useLoadRegistry from "../../queries/useLoadRegistry";
import PermissionsDisplay from "../../components/PermissionsDisplay";
import { filterPermissionsByAction } from "../../utils/permissionUtils";

const PermissionsIndex = () => {
  const registryUrl = useContext(RegistryPathContext);
  const { isLoading, isSuccess, isError, data } = useLoadRegistry(registryUrl);
  const [selectedPermissionAction, setSelectedPermissionAction] = useState("");

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Permissions
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          View and manage permissions for Feast resources
        </Typography>
        {isLoading && (
          <React.Fragment>
            <CircularProgress size="small" /> Loading
          </React.Fragment>
        )}
        {isError && <p>Error loading permissions</p>}
        {isSuccess && data && (
          <React.Fragment>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Box sx={{ width: 300 }}>
                <FormControl fullWidth>
                  <InputLabel>Filter by action</InputLabel>
                  <Select
                    value={selectedPermissionAction}
                    onChange={(e) =>
                      setSelectedPermissionAction(e.target.value)
                    }
                    label="Filter by action"
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
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" component="h2">
                Permissions
              </Typography>
              <Divider sx={{ my: 1 }} />
              {data.permissions && data.permissions.length > 0 ? (
                <PermissionsDisplay
                  permissions={
                    selectedPermissionAction
                      ? filterPermissionsByAction(
                          data.permissions,
                          selectedPermissionAction,
                        )
                      : data.permissions
                  }
                />
              ) : (
                <Typography>No permissions defined in this project.</Typography>
              )}
            </Paper>
          </React.Fragment>
        )}
      </Box>
    </Container>
  );
};

export default PermissionsIndex;
