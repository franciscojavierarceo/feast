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

interface DatasetJoinKey {
  name: string;
}

interface DatasetJoinKeysTableProps {
  joinKeys: DatasetJoinKey[];
}

const DatasetJoinKeysTable = ({ joinKeys }: DatasetJoinKeysTableProps) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {joinKeys.map((joinKey, index) => (
            <TableRow key={index}>
              <TableCell>{joinKey.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DatasetJoinKeysTable;
