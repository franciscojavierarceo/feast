import React from "react";
import { Paper } from "@mui/material";
import { useParams } from "react-router-dom";
import useLoadDataSource from "./useLoadDataSource";

const DataSourceRawData = () => {
  let { dataSourceName } = useParams();

  const dsName = dataSourceName === undefined ? "" : dataSourceName;

  const { isSuccess, data } = useLoadDataSource(dsName);

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

export default DataSourceRawData;
