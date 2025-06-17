import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import CustomLink from "./CustomLink";
import { feast } from "../protos";

interface FeaturesListProps {
  projectName: string;
  featureViewName: string;
  features: feast.core.IFeatureSpecV2[];
  link: boolean;
}

const FeaturesList = ({
  projectName,
  featureViewName,
  features,
  link,
}: FeaturesListProps) => {
  let columns: { name: string; render?: any; field: any }[] = [
    {
      name: "Name",
      field: "name",
      render: (item: string) => (
        <CustomLink
          to={`/p/${projectName}/feature-view/${featureViewName}/feature/${item}`}
        >
          {item}
        </CustomLink>
      ),
    },
    {
      name: "Value Type",
      field: "valueType",
      render: (valueType: feast.types.ValueType.Enum) => {
        return feast.types.ValueType.Enum[valueType];
      },
    },
  ];

  if (!link) {
    columns[0].render = undefined;
  }

  const getRowProps = (item: feast.core.IFeatureSpecV2) => {
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
          {features.map((feature, index) => (
            <TableRow key={feature.name || index} {...getRowProps(feature)}>
              {columns.map((column) => (
                <TableCell key={column.name}>
                  {column.render
                    ? column.render(
                        feature[column.field as keyof typeof feature],
                      )
                    : feature[column.field as keyof typeof feature]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default FeaturesList;
