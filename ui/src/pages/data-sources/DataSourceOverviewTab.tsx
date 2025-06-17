import {
  Stack,
  Divider,
  CircularProgress,
  Typography,
  Paper,
  Box,
} from "@mui/material";
import React, { useContext } from "react";
import { useParams } from "react-router-dom";
import PermissionsDisplay from "../../components/PermissionsDisplay";
import RegistryPathContext from "../../contexts/RegistryPathContext";
import { FEAST_FCO_TYPES } from "../../parsers/types";
import { feast } from "../../protos";
import useLoadRegistry from "../../queries/useLoadRegistry";
import { getEntityPermissions } from "../../utils/permissionUtils";
import BatchSourcePropertiesView from "./BatchSourcePropertiesView";
import FeatureViewEdgesList from "../entities/FeatureViewEdgesList";
import RequestDataSourceSchemaTable from "./RequestDataSourceSchemaTable";
import useLoadDataSource from "./useLoadDataSource";

const DataSourceOverviewTab = () => {
  let { dataSourceName } = useParams();
  const registryUrl = useContext(RegistryPathContext);
  const registryQuery = useLoadRegistry(registryUrl);

  const dsName = dataSourceName === undefined ? "" : dataSourceName;
  const { isLoading, isSuccess, isError, data, consumingFeatureViews } =
    useLoadDataSource(dsName);
  const isEmpty = data === undefined;

  return (
    <React.Fragment>
      {isLoading && (
        <React.Fragment>
          <CircularProgress size="medium" /> Loading
        </React.Fragment>
      )}
      {isEmpty && <p>No data source with name: {dataSourceName}</p>}
      {isError && <p>Error loading data source: {dataSourceName}</p>}
      {isSuccess && data && (
        <React.Fragment>
          <Stack direction="row" spacing={2}>
            <Box sx={{ flexGrow: 1 }}>
              <Stack direction="column" spacing={2}>
                <Box>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2">Properties</Typography>
                    <Divider sx={{ my: 0.5 }} />
                    {data.fileOptions || data.bigqueryOptions ? (
                      <BatchSourcePropertiesView batchSource={data} />
                    ) : data.type ? (
                      <React.Fragment>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                            Source Type
                          </Typography>
                          <Typography variant="body2">
                            {feast.core.DataSource.SourceType[data.type]}
                          </Typography>
                        </Box>
                      </React.Fragment>
                    ) : (
                      ""
                    )}
                  </Paper>
                </Box>
                <Box>
                  {data.requestDataOptions ? (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2">
                        Request Source Schema
                      </Typography>
                      <Divider sx={{ my: 0.5 }} />
                      <RequestDataSourceSchemaTable
                        fields={
                          data?.requestDataOptions?.schema!.map((obj) => {
                            return {
                              fieldName: obj.name!,
                              valueType: obj.valueType!,
                            };
                          })!
                        }
                      />
                    </Paper>
                  ) : (
                    ""
                  )}
                </Box>
              </Stack>
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2">
                  Consuming Feature Views
                </Typography>
                <Divider sx={{ my: 0.5 }} />
                {consumingFeatureViews && consumingFeatureViews.length > 0 ? (
                  <FeatureViewEdgesList
                    fvNames={consumingFeatureViews.map((f) => {
                      return f.target.name;
                    })}
                  />
                ) : (
                  <Typography variant="body1">
                    No consuming feature views
                  </Typography>
                )}
              </Paper>
              <Box sx={{ my: 2 }} />
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2">Permissions</Typography>
                <Divider sx={{ my: 0.5 }} />
                {registryQuery.data?.permissions ? (
                  <PermissionsDisplay
                    permissions={getEntityPermissions(
                      registryQuery.data.permissions,
                      FEAST_FCO_TYPES.dataSource,
                      dsName,
                    )}
                  />
                ) : (
                  <Typography variant="body1">
                    No permissions defined for this data source.
                  </Typography>
                )}
              </Paper>
            </Box>
          </Stack>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};
export default DataSourceOverviewTab;
