import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { feast } from "../../protos";

interface RequestDataSourceSchemaField {
  fieldName: string;
  valueType: feast.types.ValueType.Enum;
}

interface RequestDataSourceSchema {
  fields: RequestDataSourceSchemaField[];
}

const RequestDataSourceSchemaTable = ({ fields }: RequestDataSourceSchema) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Field</TableCell>
            <TableCell>Value Type</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {fields.map((item) => (
            <TableRow key={item.fieldName} data-test-subj={`row-${item.fieldName}`}>
              <TableCell>{item.fieldName}</TableCell>
              <TableCell>{feast.types.ValueType.Enum[item.valueType]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default RequestDataSourceSchemaTable;
