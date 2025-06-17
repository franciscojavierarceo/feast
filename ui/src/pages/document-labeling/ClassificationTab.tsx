import React, { useState } from "react";
import {
  Container,
  Alert,
  Box,
  Stack,
  FormControl,
  TextField,
  Button,
  Paper,
  Typography,
  Table,
  TableHead,
  TableCell,
  TableBody,
  TableRow,
  Select,
  CircularProgress,
} from "@mui/material";

interface ClassificationData {
  id: number;
  text: string;
  currentClass: string;
  originalClass?: string;
}

const ClassificationTab = () => {
  const [csvPath, setCsvPath] = useState("./src/sample-data.csv");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ClassificationData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [availableClasses] = useState(["positive", "negative", "neutral"]);

  const loadCsvData = async () => {
    if (!csvPath) return;

    setIsLoading(true);
    setError(null);

    try {
      if (csvPath === "./src/sample-data.csv") {
        const sampleData: ClassificationData[] = [
          {
            id: 1,
            text: "This product is amazing! I love the quality and design.",
            currentClass: "positive",
            originalClass: "positive",
          },
          {
            id: 2,
            text: "The service was terrible and the food was cold.",
            currentClass: "negative",
            originalClass: "negative",
          },
          {
            id: 3,
            text: "It's an okay product, nothing special but does the job.",
            currentClass: "neutral",
            originalClass: "neutral",
          },
          {
            id: 4,
            text: "Excellent customer support and fast delivery!",
            currentClass: "positive",
            originalClass: "positive",
          },
          {
            id: 5,
            text: "I'm not sure how I feel about this purchase.",
            currentClass: "neutral",
            originalClass: "positive",
          },
        ];

        setData(sampleData);
      } else {
        throw new Error(
          "CSV file not found. Please use the sample data path: ./src/sample-data.csv",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while loading the CSV data",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassChange = (id: number, newClass: string) => {
    setData(
      data.map((item) =>
        item.id === id ? { ...item, currentClass: newClass } : item,
      ),
    );
  };

  const getChangedItems = () => {
    return data.filter((item) => item.currentClass !== item.originalClass);
  };

  const resetChanges = () => {
    setData(
      data.map((item) => ({ ...item, currentClass: item.originalClass || "" })),
    );
  };

  const saveChanges = () => {
    const changedItems = getChangedItems();
    console.log("Saving classification changes:", changedItems);
    alert(`Saved ${changedItems.length} classification changes!`);
  };

  const columns = [
    {
      field: "id",
      name: "ID",
      width: "60px",
    },
    {
      field: "text",
      name: "Text",
      width: "60%",
    },
    {
      field: "originalClass",
      name: "Original Class",
      width: "15%",
    },
    {
      field: "currentClass",
      name: "Current Class",
      width: "20%",
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="h6" component="div" sx={{ mb: 1 }}>
          Classify sample data
        </Typography>
        <Typography variant="body2">
          Load a CSV file containing text samples and edit their classification
          labels. This helps improve your classification models by providing
          corrected training data.
        </Typography>
      </Alert>

      <Box sx={{ my: 3 }} />

      <Stack direction="row" spacing={2}>
        <Box sx={{ flexGrow: 1 }}>
          <FormControl fullWidth>
            <TextField
              label="CSV file path"
              placeholder="./src/your-data.csv"
              value={csvPath}
              onChange={(e) => setCsvPath(e.target.value)}
              variant="outlined"
            />
          </FormControl>
        </Box>
        <Box sx={{ flexShrink: 0 }}>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={loadCsvData}
              disabled={!csvPath || isLoading}
            >
              Load CSV Data
            </Button>
          </Box>
        </Box>
      </Stack>

      <Box sx={{ my: 3 }} />

      {isLoading && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ flexShrink: 0 }}>
            <CircularProgress size="medium" />
          </Box>
          <Box>
            <Typography>Loading CSV data...</Typography>
          </Box>
        </Stack>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" component="div" sx={{ mb: 1 }}>
            Error loading CSV data
          </Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      {data.length > 0 && (
        <>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box sx={{ flexShrink: 0 }}>
              <Typography variant="subtitle1">
                Classification Data ({data.length} samples)
              </Typography>
            </Box>
            <Box sx={{ flexShrink: 0 }}>
              <Stack direction="row" spacing={1}>
                <Box sx={{ flexShrink: 0 }}>
                  <Button
                    color="warning"
                    onClick={resetChanges}
                    disabled={getChangedItems().length === 0}
                  >
                    Reset Changes
                  </Button>
                </Box>
                <Box sx={{ flexShrink: 0 }}>
                  <Button
                    variant="contained"
                    onClick={saveChanges}
                    disabled={getChangedItems().length === 0}
                  >
                    Save Changes ({getChangedItems().length})
                  </Button>
                </Box>
              </Stack>
            </Box>
          </Stack>

          <Box sx={{ my: 2 }} />

          <Paper sx={{ p: 0 }}>
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableCell key={index} sx={{ width: column.width }}>
                      {column.name}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.text}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={
                          item.originalClass === "positive"
                            ? "success.main"
                            : item.originalClass === "negative"
                              ? "error.main"
                              : "text.primary"
                        }
                      >
                        {item.originalClass}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.currentClass}
                        onChange={(e) =>
                          handleClassChange(item.id, e.target.value)
                        }
                        size="small"
                        sx={{ minWidth: 120 }}
                      >
                        {availableClasses.map((cls) => (
                          <option key={cls} value={cls}>
                            {cls}
                          </option>
                        ))}
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          {getChangedItems().length > 0 && (
            <>
              <Box sx={{ my: 3 }} />
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                  {getChangedItems().length} items have been modified
                </Typography>
                <Typography variant="body2">
                  You have unsaved changes. Click "Save Changes" to persist your
                  modifications.
                </Typography>
              </Alert>
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default ClassificationTab;
