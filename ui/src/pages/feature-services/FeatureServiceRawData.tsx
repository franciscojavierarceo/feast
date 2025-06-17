import React from "react";
import { Paper } from "@mui/material";
import { useParams } from "react-router-dom";
import useLoadFeatureService from "./useLoadFeatureService";

const FeatureServiceRawData = () => {
  let { featureServiceName } = useParams();

  const fsName = featureServiceName === undefined ? "" : featureServiceName;

  const { isSuccess, data } = useLoadFeatureService(fsName);

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

export default FeatureServiceRawData;
