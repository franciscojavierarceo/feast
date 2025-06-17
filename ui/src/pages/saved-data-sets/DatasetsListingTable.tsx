import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import CustomLink from "../../components/CustomLink";
import { useParams } from "react-router-dom";
import { feast } from "../../protos";
import { toDate } from "../../utils/timestamp";

interface DatasetsListingTableProps {
  datasets: feast.core.ISavedDataset[];
}

const DatasetsListingTable = ({ datasets }: DatasetsListingTableProps) => {
  const { projectName } = useParams();

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Source Feature Service</TableCell>
            <TableCell>Created</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {datasets.map((dataset) => (
            <TableRow key={dataset.spec?.name} data-test-subj={`row-${dataset.spec?.name}`}>
              <TableCell>
                <CustomLink to={`/p/${projectName}/data-set/${dataset.spec?.name}`}>
                  {dataset.spec?.name}
                </CustomLink>
              </TableCell>
              <TableCell>{dataset.spec?.featureServiceName}</TableCell>
              <TableCell>
                {toDate(dataset?.meta?.createdTimestamp!).toLocaleString("en-CA")!}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DatasetsListingTable;
