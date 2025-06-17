import React from "react";
import {
  Chip,
  Stack,
  Box,
  Paper,
  Typography,
  Divider,
  Tooltip,
} from "@mui/material";
import { formatPermissions } from "../utils/permissionUtils";

interface PermissionsDisplayProps {
  permissions: any[] | undefined;
}

const PermissionsDisplay: React.FC<PermissionsDisplayProps> = ({
  permissions,
}) => {
  if (!permissions || permissions.length === 0) {
    return <Typography>No permissions defined for this resource.</Typography>;
  }

  const getActionColor = (action: string) => {
    if (action.startsWith("READ")) return "success";
    if (action.startsWith("WRITE")) return "warning";
    if (action === "CREATE") return "primary";
    if (action === "UPDATE") return "accent";
    if (action === "DELETE") return "danger";
    return "default";
  };

  return (
    <React.Fragment>
      {permissions.map((permission, index) => {
        const actions = permission.spec?.actions?.map((a: number) => {
          const actionNames = [
            "CREATE",
            "DESCRIBE",
            "UPDATE",
            "DELETE",
            "READ_ONLINE",
            "READ_OFFLINE",
            "WRITE_ONLINE",
            "WRITE_OFFLINE",
          ];
          return actionNames[a] || `Unknown (${a})`;
        });

        return (
          <Box key={index} sx={{ mb: 1 }}>
            <Tooltip
              placement="top"
              title={
                <Box>
                  <Typography variant="body2">
                    <strong>Name:</strong> {permission.spec?.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Policy:</strong>{" "}
                    {permission.spec?.policy?.roles
                      ? `Roles: ${permission.spec.policy.roles.join(", ")}`
                      : "No policy defined"}
                  </Typography>
                  {permission.spec?.name_patterns && (
                    <Typography variant="body2">
                      <strong>Name Patterns:</strong>{" "}
                      {Array.isArray(permission.spec.name_patterns)
                        ? permission.spec.name_patterns.join(", ")
                        : permission.spec.name_patterns}
                    </Typography>
                  )}
                  {permission.spec?.required_tags && (
                    <Typography variant="body2">
                      <strong>Required Tags:</strong>{" "}
                      {Object.entries(permission.spec.required_tags)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(", ")}
                    </Typography>
                  )}
                </Box>
              }
            >
              <Typography variant="h6">{permission.spec?.name}</Typography>
            </Tooltip>
            <Stack direction="row" spacing={0.5} flexWrap="wrap">
              {actions.map((action: string, actionIndex: number) => (
                <Chip
                  key={actionIndex}
                  label={action}
                  color={
                    getActionColor(action) === "success"
                      ? "success"
                      : getActionColor(action) === "warning"
                        ? "warning"
                        : getActionColor(action) === "primary"
                          ? "primary"
                          : getActionColor(action) === "danger"
                            ? "error"
                            : "default"
                  }
                  size="small"
                />
              ))}
            </Stack>
          </Box>
        );
      })}
    </React.Fragment>
  );
};

export default PermissionsDisplay;
