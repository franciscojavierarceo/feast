import React, { useState, useContext } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Container,
  Box,
  Tooltip,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  TableSortLabel,
  TablePagination,
} from "@mui/material";
import { Lock } from "@mui/icons-material";
import CustomLink from "../../components/CustomLink";
import ExportButton from "../../components/ExportButton";
import { useParams } from "react-router-dom";
import useLoadRegistry from "../../queries/useLoadRegistry";
import RegistryPathContext from "../../contexts/RegistryPathContext";
import { FeatureIcon } from "../../graphics/FeatureIcon";
import { FEAST_FCO_TYPES } from "../../parsers/types";
import {
  getEntityPermissions,
  formatPermissions,
  filterPermissionsByAction,
} from "../../utils/permissionUtils";

interface Feature {
  name: string;
  featureView: string;
  type: string;
  permissions?: any[];
}

interface FeatureColumn {
  id: keyof Feature;
  label: string;
  sortable: boolean;
  render?: (value: any, feature: Feature) => React.ReactNode;
}

const FeatureListPage = () => {
  const { projectName } = useParams();
  const registryUrl = useContext(RegistryPathContext);
  const { data, isLoading, isError } = useLoadRegistry(registryUrl);
  const [searchText, setSearchText] = useState("");
  const [selectedPermissionAction, setSelectedPermissionAction] = useState("");

  const [sortField, setSortField] = useState<keyof Feature>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(100);

  const featuresWithPermissions: Feature[] = (data?.allFeatures || []).map(
    (feature) => {
      return {
        ...feature,
        permissions: getEntityPermissions(
          selectedPermissionAction
            ? filterPermissionsByAction(
                data?.permissions,
                selectedPermissionAction,
              )
            : data?.permissions,
          FEAST_FCO_TYPES.featureView,
          feature.featureView,
        ),
      };
    },
  );

  const features: Feature[] = featuresWithPermissions;

  const filteredFeatures = features.filter((feature) =>
    feature.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  const sortedFeatures = [...filteredFeatures].sort((a, b) => {
    const valueA = String(a[sortField] || "").toLowerCase();
    const valueB = String(b[sortField] || "").toLowerCase();
    return sortDirection === "asc"
      ? valueA.localeCompare(valueB)
      : valueB.localeCompare(valueA);
  });

  const paginatedFeatures = sortedFeatures.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize,
  );

  const columns: FeatureColumn[] = [
    {
      id: "name",
      label: "Feature Name",
      sortable: true,
      render: (name: string, feature: Feature) => (
        <CustomLink
          to={`/p/${projectName}/feature-view/${feature.featureView}/feature/${name}`}
        >
          {name}
        </CustomLink>
      ),
    },
    {
      id: "featureView",
      label: "Feature View",
      sortable: true,
      render: (featureView: string) => (
        <CustomLink to={`/p/${projectName}/feature-view/${featureView}`}>
          {featureView}
        </CustomLink>
      ),
    },
    { id: "type", label: "Type", sortable: true },
    {
      id: "permissions",
      label: "Permissions",
      sortable: false,
      render: (permissions: any[], feature: Feature) => {
        const hasPermissions = permissions && permissions.length > 0;
        return hasPermissions ? (
          <Tooltip
            title={
              <pre style={{ margin: 0 }}>{formatPermissions(permissions)}</pre>
            }
            placement="top"
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Lock sx={{ color: "#5a7be0", fontSize: 16 }} />
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                {permissions.length} permission
                {permissions.length !== 1 ? "s" : ""}
              </Typography>
            </Box>
          </Tooltip>
        ) : (
          <Typography variant="caption" color="text.secondary">
            None
          </Typography>
        );
      },
    },
  ];

  const handleSort = (field: keyof Feature) => {
    const isAsc = sortField === field && sortDirection === "asc";
    setSortDirection(isAsc ? "desc" : "asc");
    setSortField(field);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPageIndex(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setPageSize(parseInt(event.target.value, 10));
    setPageIndex(0);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <FeatureIcon style={{ marginRight: 8 }} />
            <Typography variant="h4">Feature List</Typography>
          </Box>
          <ExportButton data={filteredFeatures} fileName="features" />
        </Box>
        <Box>
          {isLoading ? (
            <p>Loading...</p>
          ) : isError ? (
            <p>We encountered an error while loading.</p>
          ) : (
            <>
              <Stack direction="row" spacing={2} alignItems="flex-end">
                <Box sx={{ flexGrow: 1 }}>
                  <TextField
                    placeholder="Search features"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    fullWidth
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ width: 300, flexShrink: 0 }}>
                  <FormControl fullWidth>
                    <InputLabel>Filter by permission action</InputLabel>
                    <Select
                      value={selectedPermissionAction}
                      onChange={(e) =>
                        setSelectedPermissionAction(e.target.value)
                      }
                      label="Filter by permission action"
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="CREATE">CREATE</MenuItem>
                      <MenuItem value="DESCRIBE">DESCRIBE</MenuItem>
                      <MenuItem value="UPDATE">UPDATE</MenuItem>
                      <MenuItem value="DELETE">DELETE</MenuItem>
                      <MenuItem value="READ_ONLINE">READ_ONLINE</MenuItem>
                      <MenuItem value="READ_OFFLINE">READ_OFFLINE</MenuItem>
                      <MenuItem value="WRITE_ONLINE">WRITE_ONLINE</MenuItem>
                      <MenuItem value="WRITE_OFFLINE">WRITE_OFFLINE</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Stack>
              <Box sx={{ my: 2 }} />
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      {columns.map((column) => (
                        <TableCell key={column.id}>
                          {column.sortable ? (
                            <TableSortLabel
                              active={sortField === column.id}
                              direction={
                                sortField === column.id ? sortDirection : "asc"
                              }
                              onClick={() => handleSort(column.id)}
                            >
                              {column.label}
                            </TableSortLabel>
                          ) : (
                            column.label
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedFeatures.map((feature) => (
                      <TableRow
                        key={feature.name}
                        data-test-subj={`row-${feature.name}`}
                      >
                        {columns.map((column) => (
                          <TableCell key={column.id}>
                            {column.render
                              ? column.render(feature[column.id], feature)
                              : feature[column.id]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[20, 50, 100]}
                  component="div"
                  count={sortedFeatures.length}
                  rowsPerPage={pageSize}
                  page={pageIndex}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </TableContainer>
            </>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default FeatureListPage;
