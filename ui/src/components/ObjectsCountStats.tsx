import React, { useContext } from "react";
import {
  Stack,
  Box,
  Divider,
  Typography,
} from "@mui/material";
import useLoadRegistry from "../queries/useLoadRegistry";
import { useNavigate, useParams } from "react-router-dom";
import RegistryPathContext from "../contexts/RegistryPathContext";

const useLoadObjectStats = () => {
  const registryUrl = useContext(RegistryPathContext);
  const query = useLoadRegistry(registryUrl);

  const data =
    query.isSuccess && query.data
      ? {
          featureServices: query.data.objects.featureServices?.length || 0,
          featureViews: query.data.mergedFVList.length,
          entities: query.data.objects.entities?.length || 0,
          dataSources: query.data.objects.dataSources?.length || 0,
        }
      : undefined;

  return {
    ...query,
    data,
  };
};

const statStyle = { cursor: "pointer" };

const ObjectsCountStats = () => {
  const { isLoading, isSuccess, isError, data } = useLoadObjectStats();
  const { projectName } = useParams();

  const navigate = useNavigate();

  return (
    <React.Fragment>
      <Box sx={{ my: 3 }} />
      <Divider sx={{ my: 0.5 }} />
      {isLoading && <p>Loading</p>}
      {isError && <p>There was an error in loading registry information.</p>}
      {isSuccess && data && (
        <React.Fragment>
          <Typography variant="subtitle2">
            Registered in this Feast project are &hellip;
          </Typography>
          <Box sx={{ my: 1 }} />
          <Stack direction="row" spacing={2}>
            <Box sx={{ flexGrow: 1 }}>
              <Box
                sx={{ ...statStyle, textAlign: 'center', p: 2 }}
                onClick={() => navigate(`/p/${projectName}/feature-service`)}
              >
                <Typography variant="h4">{data.featureServices}</Typography>
                <Typography variant="body2">Feature Services→</Typography>
              </Box>
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Box
                sx={{ ...statStyle, textAlign: 'center', p: 2 }}
                onClick={() => navigate(`/p/${projectName}/feature-view`)}
              >
                <Typography variant="h4">{data.featureViews}</Typography>
                <Typography variant="body2">Feature Views→</Typography>
              </Box>
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Box
                sx={{ ...statStyle, textAlign: 'center', p: 2 }}
                onClick={() => navigate(`/p/${projectName}/entity`)}
              >
                <Typography variant="h4">{data.entities}</Typography>
                <Typography variant="body2">Entities→</Typography>
              </Box>
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Box
                sx={{ ...statStyle, textAlign: 'center', p: 2 }}
                onClick={() => navigate(`/p/${projectName}/data-source`)}
              >
                <Typography variant="h4">{data.dataSources}</Typography>
                <Typography variant="body2">Data Sources→</Typography>
              </Box>
            </Box>
          </Stack>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default ObjectsCountStats;
