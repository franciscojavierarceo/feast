import {
  Stack,
  Divider,
  CircularProgress,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import CustomLink from "../../components/CustomLink";
import TagsDisplay from "../../components/TagsDisplay";
import React from "react";
import { useParams } from "react-router-dom";
import useLoadFeature from "./useLoadFeature";
import { feast } from "../../protos";

const FeatureOverviewTab = () => {
  let { projectName, FeatureViewName, FeatureName } = useParams();

  const eName = FeatureViewName === undefined ? "" : FeatureViewName;
  const fName = FeatureName === undefined ? "" : FeatureName;
  const { isLoading, isSuccess, isError, data, featureData } = useLoadFeature(
    eName,
    fName,
  );
  const isEmpty = data === undefined || featureData === undefined;

  return (
    <React.Fragment>
      {isLoading && (
        <React.Fragment>
          <CircularProgress size="medium" /> Loading
        </React.Fragment>
      )}
      {isEmpty && (
        <p>
          No Feature with name {FeatureName} in FeatureView {FeatureViewName}
        </p>
      )}
      {isError && (
        <p>
          Error loading Feature {FeatureName} in FeatureView {FeatureViewName}
        </p>
      )}
      {isSuccess && data && (
        <React.Fragment>
          <Stack spacing={2}>
            <Box>
              <Paper variant="outlined">
                <Typography variant="subtitle1" sx={{ p: 2, pb: 1 }}>
                  <h3>Properties</h3>
                </Typography>
                <Divider sx={{ mx: 2 }} />
                <List sx={{ p: 2 }}>
                  <ListItem sx={{ px: 0, py: 0.5 }}>
                    <ListItemText 
                      primary="Name"
                      secondary={featureData?.name}
                      primaryTypographyProps={{ variant: "subtitle2" }}
                      secondaryTypographyProps={{ variant: "body2" }}
                    />
                  </ListItem>

                  <ListItem sx={{ px: 0, py: 0.5 }}>
                    <ListItemText 
                      primary="Value Type"
                      secondary={feast.types.ValueType.Enum[featureData?.valueType!]}
                      primaryTypographyProps={{ variant: "subtitle2" }}
                      secondaryTypographyProps={{ variant: "body2" }}
                    />
                  </ListItem>

                  <ListItem sx={{ px: 0, py: 0.5 }}>
                    <ListItemText 
                      primary="Description"
                      secondary={featureData?.description}
                      primaryTypographyProps={{ variant: "subtitle2" }}
                      secondaryTypographyProps={{ variant: "body2" }}
                    />
                  </ListItem>

                  <ListItem sx={{ px: 0, py: 0.5 }}>
                    <ListItemText 
                      primary="FeatureView"
                      secondary={
                        <CustomLink
                          to={`/p/${projectName}/feature-view/${FeatureViewName}`}
                        >
                          {FeatureViewName}
                        </CustomLink>
                      }
                      primaryTypographyProps={{ variant: "subtitle2" }}
                      secondaryTypographyProps={{ variant: "body2" }}
                    />
                  </ListItem>
                </List>
              </Paper>
              <Paper variant="outlined" sx={{ flexShrink: 0 }}>
                <Typography variant="subtitle1" sx={{ p: 2, pb: 1 }}>
                  <h3>Tags</h3>
                </Typography>
                <Divider sx={{ mx: 2 }} />
                <Box sx={{ p: 2 }}>
                  {featureData?.tags ? (
                    <TagsDisplay tags={featureData.tags} />
                  ) : (
                    <Typography>No Tags specified on this field.</Typography>
                  )}
                </Box>
              </Paper>
            </Box>
          </Stack>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};
export default FeatureOverviewTab;
