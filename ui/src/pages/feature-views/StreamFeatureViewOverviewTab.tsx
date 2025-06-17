import { Paper, Stack, Box, Typography, Divider } from "@mui/material";
import React from "react";
import FeaturesListDisplay from "../../components/FeaturesListDisplay";
import { useParams } from "react-router-dom";
import { EntityRelation } from "../../parsers/parseEntityRelationships";
import { FEAST_FCO_TYPES } from "../../parsers/types";
import useLoadRelationshipData from "../../queries/useLoadRelationshipsData";
import ConsumingFeatureServicesList from "./ConsumingFeatureServicesList";
import CustomLink from "../../components/CustomLink";
import { feast } from "../../protos";

interface StreamFeatureViewOverviewTabProps {
  data: feast.core.IStreamFeatureView;
}

const whereFSconsumesThisFv = (fvName: string) => {
  return (r: EntityRelation) => {
    return (
      r.source.name === fvName &&
      r.target.type === FEAST_FCO_TYPES.featureService
    );
  };
};

const StreamFeatureViewOverviewTab = ({
  data,
}: StreamFeatureViewOverviewTabProps) => {
  const inputs = Object.entries([data.spec?.streamSource]);
  const { projectName } = useParams();

  const relationshipQuery = useLoadRelationshipData();
  const fsNames = relationshipQuery.data
    ? relationshipQuery.data
        .filter(whereFSconsumesThisFv(data.spec?.name!))
        .map((fs) => {
          return fs.target.name;
        })
    : [];

  return (
    <Stack direction="column" spacing={2}>
      <Box>
        <Box sx={{ flexGrow: 1 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" component="h3">
              Transformation
            </Typography>
            <Divider sx={{ my: 0.5 }} />
            <Typography 
              component="pre" 
              sx={{ 
                fontFamily: 'monospace', 
                bgcolor: 'grey.100', 
                p: 2, 
                borderRadius: 1,
                overflow: 'auto',
                whiteSpace: 'pre-wrap'
              }}
            >
              {data.spec?.userDefinedFunction?.bodyText}
            </Typography>
          </Paper>
        </Box>
      </Box>
      <Stack direction="row" spacing={2}>
        <Box sx={{ flexGrow: 1 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" component="h3">
              Features ({data.spec?.features?.length})
            </Typography>
            <Divider sx={{ my: 0.5 }} />
            {projectName && data.spec?.features ? (
              <FeaturesListDisplay
                projectName={projectName}
                featureViewName={data.spec.name!}
                features={data.spec.features}
                link={false}
              />
            ) : (
              <Typography variant="body1">No Tags sepcified on this feature view.</Typography>
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
                return (
                  <Paper variant="outlined" sx={{ p: 2 }} key={key}>
                    <Typography variant="caption">
                      <span>Stream Source</span>
                    </Typography>
                    <Typography variant="subtitle1">
                      <CustomLink
                        to={`/p/${projectName}/data-source/${inputGroup?.name}`}
                      >
                        {inputGroup?.name}
                      </CustomLink>
                    </Typography>
                    <Box key={key}>
                      <Typography 
                        component="pre" 
                        sx={{ 
                          fontFamily: 'monospace', 
                          bgcolor: 'grey.100', 
                          p: 2, 
                          borderRadius: 1,
                          overflow: 'auto',
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {JSON.stringify(inputGroup, null, 2)}
                      </Typography>
                    </Box>
                  </Paper>
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
              <Typography variant="body1">No services consume this feature view</Typography>
            )}
          </Paper>
        </Box>
      </Stack>
    </Stack>
  );
};

export default StreamFeatureViewOverviewTab;
