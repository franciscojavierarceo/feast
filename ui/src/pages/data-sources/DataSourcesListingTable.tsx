import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import CustomLink from "../../components/CustomLink";
import { useParams } from "react-router-dom";
import { feast } from "../../protos";

interface DatasourcesListingTableProps {
  dataSources: feast.core.IDataSource[];
}

const DatasourcesListingTable = ({
  dataSources,
}: DatasourcesListingTableProps) => {
  const { projectName } = useParams();

  const columns = [
    {
      name: "Name",
      field: "name" as const,
      sortable: true,
      render: (name: string) => {
        return (
          <CustomLink to={`/p/${projectName}/data-source/${name}`}>
            {name}
          </CustomLink>
        );
      },
    },
    {
      name: "Type",
      field: "type" as const,
      sortable: true,
      render: (valueType: feast.core.DataSource.SourceType) => {
        return feast.core.DataSource.SourceType[valueType];
      },
    },
  ] as const;

  const getRowProps = (item: feast.core.IDataSource) => {
    return {
      "data-test-subj": `row-${item.name}`,
    };
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.field}>{column.name}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {dataSources.map((item) => (
            <TableRow key={item.name} {...getRowProps(item)}>
              <TableCell>{columns[0].render(item.name!)}</TableCell>
              <TableCell>{columns[1].render(item.type!)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DatasourcesListingTable;
