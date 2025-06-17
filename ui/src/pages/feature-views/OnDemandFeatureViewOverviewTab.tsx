import { Stack, Box, Divider, Typography, Paper } from "@mui/material";
import React from "react";
import FeaturesListDisplay from "../../components/FeaturesListDisplay";
import { useParams } from "react-router-dom";
import { EntityRelation } from "../../parsers/parseEntityRelationships";
import { FEAST_FCO_TYPES } from "../../parsers/types";
import useLoadRelationshipData from "../../queries/useLoadRelationshipsData";
import FeatureViewProjectionDisplayPanel from "./components/FeatureViewProjectionDisplayPanel";
import RequestDataDisplayPanel from "./components/RequestDataDisplayPanel";
import ConsumingFeatureServicesList from "./ConsumingFeatureServicesList";
import { feast } from "../../protos";

interface OnDemandFeatureViewOverviewTabProps {
  data: feast.core.IOnDemandFeatureView;
}

const whereFSconsumesThisFv = (fvName: string) => {
  return (r: EntityRelation) => {
    return (
      r.source.name === fvName &&
      r.target.type === FEAST_FCO_TYPES.featureService
    );
  };
};

const OnDemandFeatureViewOverviewTab = ({
  data,
}: OnDemandFeatureViewOverviewTabProps) => {
  const inputs = Object.entries(data?.spec?.sources!);
  const { projectName } = useParams();

  const relationshipQuery = useLoadRelationshipData();
  const fsNames = relationshipQuery.data
    ? relationshipQuery.data
        .filter(whereFSconsumesThisFv(data?.spec?.name!))
        .map((fs) => {
          return fs.target.name;
        })
    : [];

  return (
    <Stack direction="column" spacing={2}>
      <Box>
        <Box>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" component="h3">
              Transformation
            </Typography>
            <Divider sx={{ my: 0.5 }} />
            <Typography
              component="pre"
              sx={{
                fontFamily: "monospace",
                bgcolor: "grey.100",
                p: 2,
                borderRadius: 1,
                overflow: "auto",
                whiteSpace: "pre-wrap",
              }}
            >
              {data?.spec?.featureTransformation?.userDefinedFunction?.bodyText}
            </Typography>
          </Paper>
        </Box>
      </Box>
      <Stack direction="row" spacing={2}>
        <Box sx={{ flexGrow: 1 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" component="h3">
              Features ({data?.spec?.features!.length})
            </Typography>
            <Divider sx={{ my: 0.5 }} />
            {projectName && data?.spec?.features ? (
              <FeaturesListDisplay
                projectName={projectName}
                featureViewName={data?.spec?.name!}
                features={data.spec.features}
                link={false}
              />
            ) : (
              <Typography>No Tags sepcified on this feature view.</Typography>
            )}
          </Paper>
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" component="h3">
              Inputs ({inputs.length})
            </Typography>
            <Divider sx={{ my: 0.5 }} />
            <Stack direction="column" spacing={2}>
              {inputs.map(([key, inputGroup]) => {
                if (
                  (inputGroup as feast.core.IOnDemandSource).requestDataSource
                ) {
                  return (
                    <Box key={key}>
                      <RequestDataDisplayPanel
                        {...(inputGroup as feast.core.IOnDemandSource)}
                      />
                    </Box>
                  );
                }

                if (
                  (inputGroup as feast.core.IOnDemandSource)
                    .featureViewProjection
                ) {
                  return (
                    <Box key={key}>
                      <FeatureViewProjectionDisplayPanel
                        {...(inputGroup.featureViewProjection as feast.core.IFeatureViewProjection)}
                      />
                    </Box>
                  );
                }

                return (
                  <Box key={key}>
                    <Typography
                      component="pre"
                      sx={{
                        fontFamily: "monospace",
                        bgcolor: "grey.100",
                        p: 2,
                        borderRadius: 1,
                        overflow: "auto",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {JSON.stringify(inputGroup, null, 2)}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
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
              <Typography>No services consume this feature view</Typography>
            )}
          </Paper>
        </Box>
      </Stack>
    </Stack>
  );
};

export default OnDemandFeatureViewOverviewTab;
