import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import CustomLink from "./CustomLink";
import { useParams } from "react-router-dom";
import { feast } from "../protos";

interface FeatureViewsListInterace {
  featureViews: feast.core.IFeatureViewProjection[];
}

interface IFeatureColumnInService {
  featureViewName: string;
  name: string;
  valueType: feast.types.ValueType.Enum;
}

const FeaturesInServiceList = ({ featureViews }: FeatureViewsListInterace) => {
  const { projectName } = useParams();
  const items: IFeatureColumnInService[] = featureViews.flatMap((featureView) =>
    featureView.featureColumns!.map((featureColumn) => ({
      featureViewName: featureView.featureViewName!,
      name: featureColumn.name!,
      valueType: featureColumn.valueType!,
    })),
  );

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Feature View</TableCell>
            <TableCell>Feature Column</TableCell>
            <TableCell>Value Type</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index} data-test-subj={`row-${item.featureViewName}`}>
              <TableCell>
                <CustomLink to={`/p/${projectName}/feature-view/${item.featureViewName}`}>
                  {item.featureViewName}
                </CustomLink>
              </TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{feast.types.ValueType.Enum[item.valueType]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default FeaturesInServiceList;
