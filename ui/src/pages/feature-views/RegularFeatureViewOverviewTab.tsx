import { Paper, Stack, Box, Typography, Divider, Chip } from "@mui/material";
import React from "react";

import { useNavigate, useParams } from "react-router-dom";
import FeaturesListDisplay from "../../components/FeaturesListDisplay";
import PermissionsDisplay from "../../components/PermissionsDisplay";
import TagsDisplay from "../../components/TagsDisplay";
import { encodeSearchQueryString } from "../../hooks/encodeSearchQueryString";
import { EntityRelation } from "../../parsers/parseEntityRelationships";
import { FEAST_FCO_TYPES } from "../../parsers/types";
import useLoadRelationshipData from "../../queries/useLoadRelationshipsData";
import { getEntityPermissions } from "../../utils/permissionUtils";
import BatchSourcePropertiesView from "../data-sources/BatchSourcePropertiesView";
import ConsumingFeatureServicesList from "./ConsumingFeatureServicesList";
import { feast } from "../../protos";
import { toDate } from "../../utils/timestamp";

const whereFSconsumesThisFv = (fvName: string) => {
  return (r: EntityRelation) => {
    return (
      r.source.name === fvName &&
      r.target.type === FEAST_FCO_TYPES.featureService
    );
  };
};

interface RegularFeatureViewOverviewTabProps {
  data: feast.core.IFeatureView;
  permissions?: any[];
}

const RegularFeatureViewOverviewTab = ({
  data,
  permissions,
}: RegularFeatureViewOverviewTabProps) => {
  const navigate = useNavigate();

  const { projectName } = useParams();
  const { featureViewName } = useParams();

  const fvName = featureViewName === undefined ? "" : featureViewName;

  const relationshipQuery = useLoadRelationshipData();

  const fsNames = relationshipQuery.data
    ? relationshipQuery.data.filter(whereFSconsumesThisFv(fvName)).map((fs) => {
        return fs.target.name;
      })
    : [];
  const numOfFs = fsNames.length;

  return (
    <React.Fragment>
      <Stack direction="row">
        <Box sx={{ textAlign: "center", p: 2 }}>
          <Typography variant="h4" component="div">
            {numOfFs}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Consuming Services
          </Typography>
        </Box>
      </Stack>
      <Box sx={{ my: 3 }} />
      <Stack direction="row" spacing={2}>
        <Box sx={{ flexGrow: 1 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" component="h3">
              Features ({data?.spec?.features?.length})
            </Typography>
            <Divider sx={{ my: 0.5 }} />
            {projectName && data?.spec?.features ? (
              <FeaturesListDisplay
                projectName={projectName}
                featureViewName={data?.spec?.name!}
                features={data.spec.features}
                link={true}
              />
            ) : (
              <Typography variant="body1">
                No features specified on this feature view.
              </Typography>
            )}
          </Paper>
        </Box>
        <Box sx={{ flexShrink: 0 }}>
          <Paper variant="outlined" sx={{ p: 2, flexShrink: 0 }}>
            <Typography variant="subtitle2" component="h3">
              Entities
            </Typography>
            <Divider sx={{ my: 0.5 }} />
            {data?.spec?.entities ? (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {data.spec.entities.map((entity) => {
                  return (
                    <Box sx={{ flexShrink: 0 }} key={entity}>
                      <Chip
                        color="primary"
                        onClick={() => {
                          navigate(`/p/${projectName}/entity/${entity}`);
                        }}
                        aria-label={entity}
                        data-test-sub="testExample1"
                        label={entity}
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
              Consuming Feature Services
            </Typography>
            <Divider sx={{ my: 0.5 }} />
            {fsNames.length > 0 ? (
              <ConsumingFeatureServicesList fsNames={fsNames} />
            ) : (
              <Typography variant="body1">
                No services consume this feature view
              </Typography>
            )}
          </Paper>
          <Box sx={{ my: 2 }} />
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
                    `/p/${projectName}/feature-view?` +
                    encodeSearchQueryString(`${key}:${value}`)
                  );
                }}
                owner={data?.spec?.owner!}
                description={data?.spec?.description!}
              />
            ) : (
              <Typography variant="body1">
                No Tags specified on this feature view.
              </Typography>
            )}
          </Paper>
          <Box sx={{ my: 2 }} />
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" component="h3">
              Permissions
            </Typography>
            <Divider sx={{ my: 0.5 }} />
            {permissions ? (
              <PermissionsDisplay
                permissions={getEntityPermissions(
                  permissions,
                  FEAST_FCO_TYPES.featureView,
                  data?.spec?.name,
                )}
              />
            ) : (
              <Typography variant="body1">
                No permissions defined for this feature view.
              </Typography>
            )}
          </Paper>
        </Box>
      </Stack>
      <Box sx={{ my: 3 }} />
      <Stack direction="row" spacing={2}>
        <Box sx={{ flexGrow: 1 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" component="h3">
              Batch Source
            </Typography>
            <Divider sx={{ my: 0.5 }} />
            <BatchSourcePropertiesView batchSource={data?.spec?.batchSource!} />
          </Paper>
        </Box>
      </Stack>
      <Box sx={{ my: 3 }} />
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" component="h3">
          Materialization Intervals
        </Typography>
        <React.Fragment>
          {data?.meta?.materializationIntervals?.map((interval, i) => {
            return (
              <p key={i}>
                {toDate(interval.startTime!).toLocaleDateString("en-CA")} to{" "}
                {toDate(interval.endTime!).toLocaleDateString("en-CA")}
              </p>
            );
          })}
        </React.Fragment>
      </Paper>
    </React.Fragment>
  );
};

export default RegularFeatureViewOverviewTab;
