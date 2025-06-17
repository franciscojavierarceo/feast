import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from "@mui/material";
import CustomLink from "../../components/CustomLink";
import { useParams } from "react-router-dom";
import useLoadRelationshipData from "../../queries/useLoadRelationshipsData";
import { EntityRelation } from "../../parsers/parseEntityRelationships";
import { FEAST_FCO_TYPES } from "../../parsers/types";

interface FeatureViewEdgesListInterace {
  fvNames: string[];
}

const whereFSconsumesThisFv = (fvName: string) => {
  return (r: EntityRelation) => {
    return (
      r.source.name === fvName &&
      r.target.type === FEAST_FCO_TYPES.featureService
    );
  };
};

const useGetFSConsumersOfFV = (fvList: string[]) => {
  const relationshipQuery = useLoadRelationshipData();

  const data = relationshipQuery.data
    ? fvList.reduce((memo: Record<string, string[]>, fvName) => {
        if (relationshipQuery.data) {
          memo[fvName] = relationshipQuery.data
            .filter(whereFSconsumesThisFv(fvName))
            .map((fs) => {
              return fs.target.name;
            });
        }

        return memo;
      }, {})
    : undefined;

  return {
    ...relationshipQuery,
    data,
  };
};

const FeatureViewEdgesList = ({ fvNames }: FeatureViewEdgesListInterace) => {
  const { projectName } = useParams();

  const { isLoading, data } = useGetFSConsumersOfFV(fvNames);

  const columns = [
    {
      name: "Name",
      field: "",
      render: ({ name }: { name: string }) => {
        return (
          <CustomLink to={`/p/${projectName}/feature-view/${name}`}>
            {name}
          </CustomLink>
        );
      },
    },
    {
      name: "FS Consumers",
      field: "",
      render: ({ name }: { name: string }) => {
        return (
          <React.Fragment>
            {isLoading && <CircularProgress size={16} />}
            {data && data[name].length}
          </React.Fragment>
        );
      },
    },
  ];

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
            {columns.map((column) => (
              <TableCell key={column.name}>{column.name}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {fvNames.map((name) => (
            <TableRow key={name} {...getRowProps(name)}>
              {columns.map((column) => (
                <TableCell key={column.name}>
                  {column.render({ name })}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default FeatureViewEdgesList;
