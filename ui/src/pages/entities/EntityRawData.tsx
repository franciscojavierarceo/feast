import React from "react";
import { Paper } from "@mui/material";
import { useParams } from "react-router-dom";
import useLoadEntity from "./useLoadEntity";

const EntityRawData = () => {
  let { entityName } = useParams();

  const eName = entityName === undefined ? "" : entityName;

  const { isSuccess, data } = useLoadEntity(eName);

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
