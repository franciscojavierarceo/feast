import React from "react";
import { Box, Typography } from "@mui/material";
import { CopyBlock, atomOneDark } from "react-code-blocks";
import { feast } from "../../protos";
import { toDate } from "../../utils/timestamp";

interface BatchSourcePropertiesViewProps {
  batchSource: feast.core.IDataSource;
}

const BatchSourcePropertiesView = (props: BatchSourcePropertiesViewProps) => {
  const batchSource = props.batchSource;
  return (
    <React.Fragment>
      <Box sx={{ display: "flex" }}>
        <Box sx={{ flexShrink: 0 }}>
          <Box>
            {(batchSource.dataSourceClassType || batchSource.type) && (
              <React.Fragment>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", mb: 0.5 }}
                >
                  Source Type
                </Typography>
                {batchSource.dataSourceClassType ? (
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {batchSource.dataSourceClassType.split(".").at(-1)}
                  </Typography>
                ) : feast.core.DataSource.SourceType[batchSource.type!] ? (
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {batchSource.type}
                  </Typography>
                ) : (
                  ""
                )}
              </React.Fragment>
            )}

            {batchSource.owner && (
              <React.Fragment>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", mb: 0.5 }}
                >
                  Owner
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {batchSource.owner}
                </Typography>
              </React.Fragment>
            )}
            {batchSource.description && (
              <React.Fragment>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", mb: 0.5 }}
                >
                  Description
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {batchSource.description}
                </Typography>
              </React.Fragment>
            )}
            {batchSource.fileOptions && (
              <React.Fragment>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", mb: 0.5 }}
                >
                  File URL
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {batchSource.fileOptions ? batchSource.fileOptions.uri : ""}
                </Typography>
              </React.Fragment>
            )}
            {batchSource.bigqueryOptions && (
              <React.Fragment>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", mb: 0.5 }}
                >
                  Source {batchSource.bigqueryOptions.table ? "Table" : "Query"}
                </Typography>
                {batchSource.bigqueryOptions.table ? (
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {batchSource.bigqueryOptions.table}
                  </Typography>
                ) : (
                  <CopyBlock
                    text={batchSource.bigqueryOptions.query ?? ""}
                    language="sql"
                    showLineNumbers={false}
                    theme={atomOneDark}
                    wrapLongLines
                  />
                )}
              </React.Fragment>
            )}
            {batchSource.meta?.latestEventTimestamp && (
              <React.Fragment>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", mb: 0.5 }}
                >
                  Latest Event
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {toDate(
                    batchSource.meta.latestEventTimestamp,
                  ).toLocaleDateString("en-CA")}
                </Typography>
              </React.Fragment>
            )}
            {batchSource.meta?.earliestEventTimestamp && (
              <React.Fragment>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", mb: 0.5 }}
                >
                  Earliest Event
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {toDate(
                    batchSource.meta?.earliestEventTimestamp,
                  ).toLocaleDateString("en-CA")}
                </Typography>
              </React.Fragment>
            )}
          </Box>
        </Box>
      </Box>
    </React.Fragment>
  );
};

export default BatchSourcePropertiesView;
