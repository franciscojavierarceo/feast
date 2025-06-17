import React from "react";
import { Paper } from "@mui/material";
import { useParams } from "react-router-dom";
import useLoadFeature from "./useLoadFeature";

const FeatureRawData = () => {
  let { FeatureViewName, FeatureName } = useParams();

  const eName = FeatureViewName === undefined ? "" : FeatureViewName;
  const fName = FeatureName === undefined ? "" : FeatureName;

  const { isSuccess, data } = useLoadFeature(eName, fName);

  return isSuccess && data ? (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </Paper>
  ) : (
    <Paper variant="outlined" sx={{ p: 2 }}>
      No data so sad ;-;
    </Paper>
  );
};

export default FeatureRawData;
