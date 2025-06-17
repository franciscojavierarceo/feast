import {
  Stack,
  Divider,
  CircularProgress,
  Typography,
  Paper,
  Box,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import React, { useContext } from "react";
import { useParams } from "react-router-dom";
import PermissionsDisplay from "../../components/PermissionsDisplay";
import TagsDisplay from "../../components/TagsDisplay";
import RegistryPathContext from "../../contexts/RegistryPathContext";
import { FEAST_FCO_TYPES } from "../../parsers/types";
import { feast } from "../../protos";
import useLoadRegistry from "../../queries/useLoadRegistry";
import { getEntityPermissions } from "../../utils/permissionUtils";
import { toDate } from "../../utils/timestamp";
import FeatureViewEdgesList from "./FeatureViewEdgesList";
import useFeatureViewEdgesByEntity from "./useFeatureViewEdgesByEntity";
import useLoadEntity from "./useLoadEntity";

const EntityOverviewTab = () => {
  let { entityName } = useParams();
  const registryUrl = useContext(RegistryPathContext);
  const registryQuery = useLoadRegistry(registryUrl);

  const eName = entityName === undefined ? "" : entityName;
  const { isLoading, isSuccess, isError, data } = useLoadEntity(eName);
  const isEmpty = data === undefined;

  const fvEdges = useFeatureViewEdgesByEntity();
  const fvEdgesSuccess = fvEdges.isSuccess;
  const fvEdgesData = fvEdges.data;

  return (
    <React.Fragment>
      {isLoading && (
        <React.Fragment>
          <CircularProgress size="medium" /> Loading
        </React.Fragment>
      )}
      {isEmpty && <p>No entity with name: {entityName}</p>}
      {isError && <p>Error loading entity: {entityName}</p>}
      {isSuccess && data && (
        <React.Fragment>
          <Stack direction="row" spacing={2}>
            <Stack spacing={2} sx={{ flex: 1 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2">
                  Properties
                </Typography>
                <Divider sx={{ my: 0.5 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Join Key
                    </Typography>
                    <Typography variant="body2">
                      {data?.spec?.joinKey}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Description
                    </Typography>
                    <Typography variant="body2">
                      {data?.spec?.description}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Value Type
                    </Typography>
                    <Typography variant="body2">
                      {feast.types.ValueType.Enum[data?.spec?.valueType!]}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Created
                    </Typography>
                    <Typography variant="body2">
                      {data?.meta?.createdTimestamp ? (
                        toDate(data.meta.createdTimestamp).toLocaleDateString(
                          "en-CA",
                        )
                      ) : (
                        "No createdTimestamp specified on this entity."
                      )}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Updated
                    </Typography>
                    <Typography variant="body2">
                      {data?.meta?.lastUpdatedTimestamp ? (
                        toDate(data.meta.lastUpdatedTimestamp).toLocaleDateString(
                          "en-CA",
                        )
                      ) : (
                        "No lastUpdatedTimestamp specified on this entity."
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Stack>
            <Box sx={{ flex: 1 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2">
                  Feature Views
                </Typography>
                <Divider sx={{ my: 0.5 }} />
                {fvEdgesSuccess && fvEdgesData ? (
                  fvEdgesData[eName] ? (
                    <FeatureViewEdgesList
                      fvNames={fvEdgesData[eName].map((r) => {
                        return r.target.name;
                      })}
                    />
                  ) : (
                    <Typography variant="body1">No feature views have this entity</Typography>
                  )
                ) : (
                  <Typography variant="body1">
                    Error loading feature views that have this entity.
                  </Typography>
                )}
              </Paper>
              <Box sx={{ my: 2 }} />
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2">
                  Labels
                </Typography>
                <Divider sx={{ my: 0.5 }} />
                {data?.spec?.tags ? (
                  <TagsDisplay tags={data.spec.tags} />
                ) : (
                  <Typography variant="body1">No labels specified on this entity.</Typography>
                )}
              </Paper>
              <Box sx={{ my: 2 }} />
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2">
                  Permissions
                </Typography>
                <Divider sx={{ my: 0.5 }} />
                {registryQuery.data?.permissions ? (
                  <PermissionsDisplay
                    permissions={getEntityPermissions(
                      registryQuery.data.permissions,
                      FEAST_FCO_TYPES.entity,
                      eName,
                    )}
                  />
                ) : (
                  <Typography variant="body1">No permissions defined for this entity.</Typography>
                )}
              </Paper>
            </Box>
          </Stack>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};
export default EntityOverviewTab;
