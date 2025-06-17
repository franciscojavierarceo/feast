import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
} from "@mui/material";
import CustomLink from "../../components/CustomLink";
import { genericFVType } from "../../parsers/mergedFVTypes";
import { useParams } from "react-router-dom";

interface FeatureViewListingTableProps {
  tagKeysSet: Set<string>;
  featureViews: genericFVType[];
}

interface ColumnDef {
  name: string;
  field?: string;
  sortable?: boolean;
  render?: (value: any, item: genericFVType) => React.ReactNode;
}

const FeatureViewListingTable = ({
  tagKeysSet,
  featureViews,
}: FeatureViewListingTableProps) => {
  const { projectName } = useParams();

  const columns: ColumnDef[] = [
    {
      name: "Name",
      field: "name",
      sortable: true,
      render: (name: string, item: genericFVType) => {
        return (
          <CustomLink to={`/p/${projectName}/feature-view/${name}`}>
            {name}{" "}
            {(item.type === "ondemand" && <Chip label="ondemand" size="small" />) ||
              (item.type === "stream" && <Chip label="stream" size="small" />)}
          </CustomLink>
        );
      },
    },
    {
      name: "# of Features",
      field: "features",
      sortable: true,
      render: (features: unknown[]) => {
        return features.length;
      },
    },
  ];

  // Add columns if they come up in search
  tagKeysSet.forEach((key) => {
    columns.push({
      name: key,
      render: (item: genericFVType) => {
        let tag = <span>n/a</span>;

        if (item.type === "regular") {
          const value = item?.object?.spec!.tags
            ? item.object.spec.tags[key]
            : undefined;

          if (value) {
            tag = <span>{value}</span>;
          }
        }

        return tag;
      },
    });
  });

  const getRowProps = (item: genericFVType) => {
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
              <TableCell key={column.name}>{column.name}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {featureViews.map((item) => (
            <TableRow key={item.name} {...getRowProps(item)}>
              {columns.map((column) => (
                <TableCell key={column.name}>
                  {column.render
                    ? column.render(column.field ? item[column.field as keyof genericFVType] : item, item)
                    : column.field
                    ? String(item[column.field as keyof genericFVType])
                    : ""}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default FeatureViewListingTable;
