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
import { toDate } from "../../utils/timestamp";

interface FeatureServiceListingTableProps {
  tagKeysSet: Set<string>;
  featureServices: feast.core.IFeatureService[];
}

interface FeatureServiceTypeColumn {
  name: string;
  field?: string;
  render?: (value: any, item?: feast.core.IFeatureService) => React.ReactNode;
}

const FeatureServiceListingTable = ({
  tagKeysSet,
  featureServices,
}: FeatureServiceListingTableProps) => {
  const { projectName } = useParams();

  const columns: FeatureServiceTypeColumn[] = [
    {
      name: "Name",
      field: "spec.name",
      render: (name: string) => {
        return (
          <CustomLink to={`/p/${projectName}/feature-service/${name}`}>
            {name}
          </CustomLink>
        );
      },
    },
    {
      name: "# of Features",
      field: "spec.features",
      render: (featureViews: feast.core.IFeatureViewProjection[]) => {
        var numFeatures = 0;
        featureViews.forEach((featureView) => {
          numFeatures += featureView.featureColumns!.length;
        });
        return numFeatures;
      },
    },
    {
      name: "Last updated",
      field: "meta.lastUpdatedTimestamp",
      render: (date: any) => {
        return date ? toDate(date).toLocaleDateString("en-CA") : "n/a";
      },
    },
  ];

  tagKeysSet.forEach((key) => {
    columns.push({
      name: key,
      render: (item: feast.core.IFeatureService) => {
        let tag = <span>n/a</span>;

        const value = item?.spec?.tags ? item.spec.tags[key] : undefined;

        if (value) {
          tag = <span>{value}</span>;
        }

        return tag;
      },
    });
  });

  const getRowProps = (item: feast.core.IFeatureService) => {
    return {
      "data-test-subj": `row-${item?.spec?.name}`,
    };
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <TableCell key={index}>{column.name}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {featureServices.map((item, rowIndex) => (
            <TableRow key={rowIndex} {...getRowProps(item)}>
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex}>
                  {column.render
                    ? column.render(
                        column.field ? item.spec?.[column.field.split('.')[1] as keyof typeof item.spec] || item.meta?.[column.field.split('.')[1] as keyof typeof item.meta] : item,
                        item
                      )
                    : column.field
                    ? String(item.spec?.[column.field.split('.')[1] as keyof typeof item.spec] || item.meta?.[column.field.split('.')[1] as keyof typeof item.meta] || '')
                    : ''}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default FeatureServiceListingTable;
