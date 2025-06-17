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
import useFeatureViewEdgesByEntity from "./useFeatureViewEdgesByEntity";
import { useParams } from "react-router-dom";
import { feast } from "../../protos";

interface EntitiesListingTableProps {
  entities: feast.core.IEntity[];
}

const EntitiesListingTable = ({ entities }: EntitiesListingTableProps) => {
  const { isSuccess, data } = useFeatureViewEdgesByEntity();
  const { projectName } = useParams();

  const columns = [
    { id: "name", label: "Name", sortable: true },
    { id: "type", label: "Type", sortable: true },
    { id: "fvs", label: "# of FVs", sortable: false },
  ];

  const getRowProps = (item: feast.core.IEntity) => {
    return {
      "data-test-subj": `row-${item?.spec?.name}`,
    };
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.id}>{column.label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {entities.map((entity) => (
            <TableRow
              key={entity?.spec?.name}
              data-test-subj={`row-${entity?.spec?.name}`}
            >
              <TableCell>
                <CustomLink
                  to={`/p/${projectName}/entity/${entity?.spec?.name}`}
                >
                  {entity?.spec?.name}
                </CustomLink>
              </TableCell>
              <TableCell>
                {feast.types.ValueType.Enum[entity?.spec?.valueType!]}
              </TableCell>
              <TableCell>
                {isSuccess && data
                  ? data[entity?.spec?.name!]
                    ? data[entity?.spec?.name!].length
                    : "0"
                  : "."}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default EntitiesListingTable;
