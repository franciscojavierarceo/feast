import React from "react";
import { Paper } from "@mui/material";
import { useParams } from "react-router-dom";
import useLoadDataset from "./useLoadDataset";

const EntityRawData = () => {
  let { datasetName } = useParams();

  if (!datasetName) {
    throw new Error("Unable to get dataset name.");
  }
  const { isSuccess, data } = useLoadDataset(datasetName);

  return isSuccess && data ? (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </Paper>
  ) : (
    <Paper variant="outlined" sx={{ p: 2 }}>
      No data so sad
    </Paper>
  );
};

export default EntityRawData;
