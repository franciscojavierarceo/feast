import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";
import CustomLink from "../../../components/CustomLink";
import { feast } from "../../../protos";

interface RequestDataDisplayPanelProps extends feast.core.IOnDemandSource {}

const RequestDataDisplayPanel = ({
  requestDataSource,
}: RequestDataDisplayPanelProps) => {
  const { projectName } = useParams();

  const items = Object.entries(
    requestDataSource?.requestDataOptions?.schema!,
  ).map(([key, type]) => {
    return {
      key,
      type,
    };
  });

  const columns = [
    {
      name: "Key",
      field: "key",
    },
    {
      name: "Type",
      field: "type",
    },
  ];

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="caption">
        Request Data
      </Typography>
      <Box sx={{ mt: 0.5 }} />
      <Typography variant="subtitle1">
        <CustomLink
          to={`/p/${projectName}/data-source/${requestDataSource?.name}`}
        >
          {requestDataSource?.name}
        </CustomLink>
      </Typography>
      <Box sx={{ mt: 1 }} />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.field}>{column.name}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column.field}>
                    {String(item[column.field as keyof typeof item])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default RequestDataDisplayPanel;
