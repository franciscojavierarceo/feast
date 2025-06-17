import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import React from "react";

interface DatasetFeatureEntry {
  featureName: string;
  featureViewName: string;
}

interface DatasetFeaturesTableProps {
  features: DatasetFeatureEntry[];
}

const DatasetFeaturesTable = ({ features }: DatasetFeaturesTableProps) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Feature</TableCell>
            <TableCell>Source Feature View</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {features.map((feature, index) => (
            <TableRow key={index}>
              <TableCell>{feature.featureName}</TableCell>
              <TableCell>{feature.featureViewName}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DatasetFeaturesTable;
