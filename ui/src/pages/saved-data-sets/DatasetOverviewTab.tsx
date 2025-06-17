import {
  Stack,
  Divider,
  CircularProgress,
  Typography,
  Paper,
  Box,
} from "@mui/material";
import React from "react";
import { useParams } from "react-router-dom";
import DatasetFeaturesTable from "./DatasetFeaturesTable";
import DatasetJoinKeysTable from "./DatasetJoinKeysTable";
import useLoadDataset from "./useLoadDataset";
import { toDate } from "../../utils/timestamp";

const EntityOverviewTab = () => {
  let { datasetName } = useParams();

  if (!datasetName) {
    throw new Error(
      "Route doesn't have a 'datasetName' part. This route is likely rendering the wrong component.",
    );
  }

  const { isLoading, isSuccess, isError, data } = useLoadDataset(datasetName);
  const isEmpty = data === undefined;

  return (
    <React.Fragment>
      {isLoading && (
        <React.Fragment>
          <CircularProgress size="medium" /> Loading
        </React.Fragment>
      )}
      {isEmpty && <p>No dataset with name: {datasetName}</p>}
      {isError && <p>Error loading dataset: {datasetName}</p>}
      {isSuccess && data && (
        <React.Fragment>
          <Stack direction="row" spacing={2}>
            <Box sx={{ flexGrow: 2 }}>
              <Paper variant="outlined">
                <Typography variant="subtitle2" component="h2">
                  Features
                </Typography>
                <Divider sx={{ my: 0.5 }} />
                <DatasetFeaturesTable
                  features={
                    data.spec?.features!.map((joinedName: string) => {
                      const [featureViewName, featureName] =
                        joinedName.split(":");

                      return {
                        featureViewName,
                        featureName,
                      };
                    })!
                  }
                />
              </Paper>
              <Box sx={{ my: 2 }} />
              <Paper variant="outlined">
                <Typography variant="subtitle2" component="h2">
                  Join Keys
                </Typography>
                <Divider sx={{ my: 0.5 }} />
                <DatasetJoinKeysTable
                  joinKeys={
                    data?.spec?.joinKeys!.map((joinKey) => {
                      return { name: joinKey };
                    })!
                  }
                />
              </Paper>
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Paper variant="outlined" sx={{ flexShrink: 0 }}>
                <Typography variant="subtitle2" component="h3">
                  Properties
                </Typography>
                <Divider sx={{ my: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2">
                    Source Feature Service
                  </Typography>
                  <Typography variant="body2">
                    {data?.spec?.featureServiceName!}
                  </Typography>
                </Box>
              </Paper>
              <Box sx={{ my: 2 }} />
              <Paper variant="outlined" sx={{ flexShrink: 0 }}>
                <Box>
                  <Typography variant="subtitle2">Created</Typography>
                  <Typography variant="body2">
                    {toDate(data?.meta?.createdTimestamp!).toLocaleDateString(
                      "en-CA",
                    )}
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Stack>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};
export default EntityOverviewTab;
