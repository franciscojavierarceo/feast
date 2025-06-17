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

interface RequestDataDisplayPanelProps
  extends feast.core.IFeatureViewProjection {}

const FeatureViewProjectionDisplayPanel = (
  featureViewProjection: RequestDataDisplayPanelProps,
) => {
  const { projectName } = useParams();

  const columns = [
    {
      name: "Column Name",
      field: "name",
    },
    {
      name: "Type",
      field: "valueType",
      render: (valueType: any) => {
        return feast.types.ValueType.Enum[valueType];
      },
    },
  ];

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="caption">Feature View</Typography>
      <Box sx={{ mt: 0.5 }} />
      <Typography variant="subtitle1">
        <CustomLink
          to={`/p/${projectName}/feature-view/${featureViewProjection.featureViewName}`}
        >
          {featureViewProjection?.featureViewName}
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
            {featureViewProjection?.featureColumns?.map((item, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column.field}>
                    {column.render
                      ? column.render((item as any)[column.field])
                      : (item as any)[column.field]}
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

export default FeatureViewProjectionDisplayPanel;
