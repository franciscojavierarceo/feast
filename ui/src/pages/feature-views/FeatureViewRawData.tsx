import React from "react";
import { Paper } from "@mui/material";
import { useParams } from "react-router-dom";
import useLoadFeatureView from "./useLoadFeatureView";

const FeatureViewRawData = () => {
  let { featureViewName } = useParams();

  const fvName = featureViewName === undefined ? "" : featureViewName;

  const { isSuccess, data } = useLoadFeatureView(fvName);

  return isSuccess && data ? (
    <Paper variant="outlined" elevation={0}>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </Paper>
  ) : (
    <Paper variant="outlined" elevation={0}>
      No data so sad
    </Paper>
  );
};

export default FeatureViewRawData;
