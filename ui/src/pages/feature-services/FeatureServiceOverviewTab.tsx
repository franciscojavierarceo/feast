import {
  Paper,
  Chip,
  Stack,
  Box,
  Divider,
  CircularProgress,
  Typography,
} from "@mui/material";
import React from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import FeaturesInServiceList from "../../components/FeaturesInServiceDisplay";
import PermissionsDisplay from "../../components/PermissionsDisplay";
import TagsDisplay from "../../components/TagsDisplay";
import { encodeSearchQueryString } from "../../hooks/encodeSearchQueryString";
import FeatureViewEdgesList from "../entities/FeatureViewEdgesList";
import useLoadFeatureService from "./useLoadFeatureService";
import { toDate } from "../../utils/timestamp";
import { getEntityPermissions } from "../../utils/permissionUtils";
import { FEAST_FCO_TYPES } from "../../parsers/types";

const FeatureServiceOverviewTab = () => {
  let { featureServiceName, projectName } = useParams();

  const fsName = featureServiceName === undefined ? "" : featureServiceName;

  const { isLoading, isSuccess, isError, data, entities } =
    useLoadFeatureService(fsName);
  const isEmpty = data === undefined;

  let numFeatures = 0;
  let numFeatureViews = 0;
  if (data) {
    data?.spec?.features?.forEach((featureView) => {
      numFeatureViews += 1;
      numFeatures += featureView?.featureColumns!.length;
    });
  }

  const navigate = useNavigate();

  return (
    <React.Fragment>
      {isLoading && (
        <React.Fragment>
          <CircularProgress size="medium" /> Loading
        </React.Fragment>
      )}
      {isEmpty && <p>No feature service with name: {featureServiceName}</p>}
      {isError && <p>Error loading feature service: {featureServiceName}</p>}
      {isSuccess && data && (
        <Stack direction="column" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ flexShrink: 0 }}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4">{numFeatures}</Typography>
                <Typography variant="body1">Total Features</Typography>
              </Box>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <p>from</p>
            </Box>
            <Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4">{numFeatureViews}</Typography>
                <Typography variant="body1">Feature Views</Typography>
              </Box>
            </Box>
            {data?.meta?.lastUpdatedTimestamp ? (
              <Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h4">
                    {toDate(
                      data?.meta?.lastUpdatedTimestamp!,
                    ).toLocaleDateString("en-CA")}
                  </Typography>
                  <Typography variant="body1">Last updated</Typography>
                </Box>
              </Box>
            ) : (
              <Typography variant="body1">
                No last updated timestamp specified on this feature service.
              </Typography>
            )}
          </Stack>
          <Stack direction="row" spacing={2}>
            <Box sx={{ flexGrow: 2 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" component="h2">
                  Features
                </Typography>
                <Divider sx={{ my: 0.5 }} />
                {data?.spec?.features ? (
                  <FeaturesInServiceList featureViews={data?.spec?.features} />
                ) : (
                  <Typography variant="body1">
                    No features specified for this feature service.
                  </Typography>
                )}
              </Paper>
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" component="h3">
                  Tags
                </Typography>
                <Divider sx={{ my: 0.5 }} />
                {data?.spec?.tags ? (
                  <TagsDisplay
                    tags={data.spec.tags}
                    createLink={(key, value) => {
                      return (
                        `/p/${projectName}/feature-service?` +
                        encodeSearchQueryString(`${key}:${value}`)
                      );
                    }}
                  />
                ) : (
                  <Typography variant="body1">
                    No Tags specified on this feature service.
                  </Typography>
                )}
              </Paper>
              <Box sx={{ my: 2 }} />
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" component="h3">
                  Entities
                </Typography>
                <Divider sx={{ my: 0.5 }} />
                {entities ? (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {entities.map((entity) => {
                      return (
                        <Box sx={{ flexShrink: 0 }} key={entity.name}>
                          <Chip
                            color="primary"
                            variant="filled"
                            onClick={() => {
                              navigate(
                                `/p/${projectName}/entity/${entity.name}`,
                              );
                            }}
                            aria-label={entity.name}
                            data-test-sub="testExample1"
                            label={entity.name}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                ) : (
                  <Typography variant="body1">No Entities.</Typography>
                )}
              </Paper>
              <Box sx={{ my: 2 }} />
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" component="h3">
                  All Feature Views
                </Typography>
                <Divider sx={{ my: 0.5 }} />
                {data?.spec?.features?.length! > 0 ? (
                  <FeatureViewEdgesList
                    fvNames={
                      data?.spec?.features?.map((f) => {
                        return f.featureViewName!;
                      })!
                    }
                  />
                ) : (
                  <Typography variant="body1">
                    No feature views in this feature service
                  </Typography>
                )}
              </Paper>
              <Box sx={{ my: 2 }} />
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" component="h3">
                  Permissions
                </Typography>
                <Divider sx={{ my: 0.5 }} />
                {data?.permissions ? (
                  <PermissionsDisplay
                    permissions={getEntityPermissions(
                      data.permissions,
                      FEAST_FCO_TYPES.featureService,
                      fsName,
                    )}
                  />
                ) : (
                  <Typography variant="body1">
                    No permissions defined for this feature service.
                  </Typography>
                )}
              </Paper>
            </Box>
          </Stack>
        </Stack>
      )}
    </React.Fragment>
  );
};

export default FeatureServiceOverviewTab;
