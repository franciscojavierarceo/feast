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

interface ConsumingFeatureServicesListInterace {
  fsNames: string[];
}

const ConsumingFeatureServicesList = ({
  fsNames,
}: ConsumingFeatureServicesListInterace) => {
  const { projectName } = useParams();

  const renderNameCell = (name: string) => {
    return (
      <CustomLink to={`/p/${projectName}/feature-service/${name}`}>
        {name}
      </CustomLink>
    );
  };

  const getRowProps = (item: string) => {
    return {
      "data-test-subj": `row-${item}`,
    };
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {fsNames.map((name) => (
            <TableRow key={name} data-test-subj={`row-${name}`}>
              <TableCell>{renderNameCell(name)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ConsumingFeatureServicesList;
