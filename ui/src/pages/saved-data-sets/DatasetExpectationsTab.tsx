import React from "react";
import { Paper } from "@mui/material";
import { useParams } from "react-router-dom";
import useLoadDataset from "./useLoadDataset";

const DatasetExpectationsTab = () => {
  let { datasetName } = useParams();

  if (!datasetName) {
    throw new Error("Unable to get dataset name.");
  }
  const { isSuccess, data } = useLoadDataset(datasetName);

  if (!data || !data.spec?.name) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        No data so sad
      </Paper>
    );
  }

  return isSuccess ? (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <pre>{JSON.stringify(data.spec, null, 2)}</pre>
    </Paper>
  ) : (
    <Paper variant="outlined" sx={{ p: 2 }}>
      No data so sad
    </Paper>
  );
};

export default DatasetExpectationsTab;
