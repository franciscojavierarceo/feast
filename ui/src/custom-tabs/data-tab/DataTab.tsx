import React from "react";
import { z } from "zod";
import {
  Typography,
  Divider,
  CircularProgress,
  Table,
  TableHead,
  TableCell,
  Paper,
  Box,
  TableRow,
  TableBody,
  Stack,
} from "@mui/material";
import DataQuery from "./DataQuery";

const FeatureViewDataRowSchema = z.object({
  name: z.string(),
  value: z.string(),
});

type FeatureViewDataRowType = z.infer<typeof FeatureViewDataRowSchema>;

const LineHeightProp: React.CSSProperties = {
  lineHeight: 1,
};

const FeatureViewDataRow = ({ name, value }: FeatureViewDataRowType) => {
  return (
    <TableRow>
      <TableCell>{name}</TableCell>
      <TableCell>
        <Typography component="pre" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 0.5, borderRadius: 1, ...LineHeightProp }}>
          {value}
        </Typography>
      </TableCell>
    </TableRow>
  );
};

const FeatureViewDataTable = (data: any) => {
  var items: FeatureViewDataRowType[] = [];

  for (let element in data.data) {
    const row: FeatureViewDataRowType = {
      name: element,
      value: JSON.stringify(data.data[element], null, 2),
    };
    items.push(row);
    console.log(row);
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Data Item Name</TableCell>
          <TableCell>Data Item Value</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item) => {
          return <FeatureViewDataRow name={item.name} value={item.value} />;
        })}
      </TableBody>
    </Table>
  );
};

const DataTab = () => {
  const fName = "credit_history";
  const { isLoading, isError, isSuccess, data } = DataQuery(fName);
  const isEmpty = data === undefined;

  return (
    <React.Fragment>
      {isLoading && (
        <React.Fragment>
          <CircularProgress size="medium" /> Loading
        </React.Fragment>
      )}
      {isEmpty && <p>No feature view with name: {fName}</p>}
      {isError && <p>Error loading feature view: {fName}</p>}
      {isSuccess && data && (
        <React.Fragment>
          <Stack direction="row">
            <Box sx={{ flexGrow: 1 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" component="h3">
                  Properties
                </Typography>
                <Divider sx={{ my: 0.5 }} />
                <FeatureViewDataTable data={data} />
              </Paper>
            </Box>
          </Stack>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default DataTab;
