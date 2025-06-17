import React, { useState } from "react";
import {
  Box,
  Alert,
  Stack,
  FormControl,
  FormLabel,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { Save } from "@mui/icons-material";
import { useTheme } from "../../contexts/ThemeContext";

interface DocumentContent {
  content: string;
  file_path: string;
}

interface TextSelection {
  text: string;
  start: number;
  end: number;
}

interface DocumentLabel {
  text: string;
  start: number;
  end: number;
  label: string;
  timestamp: number;
  groundTruthLabel: string;
}

const RagTab = () => {
  const { colorMode } = useTheme();
  const [filePath, setFilePath] = useState("./src/test-document.txt");
  const [selectedText, setSelectedText] = useState<TextSelection | null>(null);
  const [labelingMode, setLabelingMode] = useState("relevant");
  const [labels, setLabels] = useState<DocumentLabel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [documentContent, setDocumentContent] =
    useState<DocumentContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [query, setQuery] = useState("");
  const [groundTruthLabel, setGroundTruthLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const loadDocument = async () => {
    if (!filePath) return;

    setIsLoading(true);
    setError(null);

    try {
      if (filePath === "./src/test-document.txt") {
        const testContent = `This is a sample document for testing the data labeling functionality in Feast UI.

The document contains multiple paragraphs and sections that can be used to test the text highlighting and labeling features.

This paragraph discusses machine learning and artificial intelligence concepts. It covers topics like neural networks, deep learning, and natural language processing. Users should be able to select and label relevant portions of this text for RAG retrieval systems.

Another section focuses on data engineering and ETL pipelines. This content explains how to process large datasets and build scalable data infrastructure. The labeling system should allow users to mark this as relevant or irrelevant for their specific use cases.

The final paragraph contains information about feature stores and real-time machine learning systems. This text can be used to test the highlighting functionality and ensure that labels are properly stored and displayed in the user interface.`;

        setDocumentContent({
          content: testContent,
          file_path: filePath,
        });

        loadSavedLabels();
      } else {
        throw new Error(
          "Document not found. Please use the test document path: ./src/test-document.txt",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while loading the document",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() && documentContent) {
      const selectedTextContent = selection.toString().trim();
      const range = selection.getRangeAt(0);

      const textContent = documentContent.content;

      let startIndex = -1;
      let endIndex = -1;

      const rangeText = range.toString();
      if (rangeText) {
        startIndex = textContent.indexOf(rangeText);
        if (startIndex !== -1) {
          endIndex = startIndex + rangeText.length;
        }
      }

      if (startIndex !== -1 && endIndex !== -1) {
        setSelectedText({
          text: selectedTextContent,
          start: startIndex,
          end: endIndex,
        });
      }
    }
  };

  const handleLabelSelection = () => {
    if (selectedText) {
      const newLabel: DocumentLabel = {
        text: selectedText.text,
        start: selectedText.start,
        end: selectedText.end,
        label: labelingMode,
        timestamp: Date.now(),
        groundTruthLabel: groundTruthLabel,
      };

      setLabels([...labels, newLabel]);
      setSelectedText(null);
      setHasUnsavedChanges(true);

      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
    }
  };

  const handleRemoveLabel = (index: number) => {
    setLabels(labels.filter((_: DocumentLabel, i: number) => i !== index));
    setHasUnsavedChanges(true);
  };

  const saveLabels = () => {
    setIsSaving(true);

    setTimeout(() => {
      try {
        const saveData = {
          filePath: filePath,
          prompt: prompt,
          query: query,
          groundTruthLabel: groundTruthLabel,
          labels: labels,
          timestamp: new Date().toISOString(),
        };

        const pathParts = filePath.split("/");
        const filename = pathParts[pathParts.length - 1];
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
        const downloadFilename = `${nameWithoutExt}-labels.json`;

        const jsonString = JSON.stringify(saveData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = downloadFilename;
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setHasUnsavedChanges(false);
        alert(
          `Successfully saved ${labels.length} labels. File downloaded as ${downloadFilename}`,
        );
      } catch (error) {
        console.error("Error saving labels:", error);
        alert("Error saving labels. Please try again.");
      } finally {
        setIsSaving(false);
      }
    }, 100);
  };

  const loadSavedLabels = () => {
    try {
      const savedData = JSON.parse(localStorage.getItem("ragLabels") || "[]");
      const fileData = savedData.find(
        (item: any) => item.filePath === filePath,
      );

      if (fileData) {
        setPrompt(fileData.prompt || "");
        setQuery(fileData.query || "");
        setGroundTruthLabel(fileData.groundTruthLabel || "");
        setLabels(fileData.labels || []);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Error loading saved labels:", error);
    }
  };

  const renderDocumentWithHighlights = (
    content: string,
  ): (string | React.ReactElement)[] => {
    const allHighlights = [...labels];

    if (selectedText) {
      allHighlights.push({
        text: selectedText.text,
        start: selectedText.start,
        end: selectedText.end,
        label: "temp-selection",
        timestamp: 0,
        groundTruthLabel: "",
      });
    }

    if (allHighlights.length === 0) {
      return [content];
    }

    const sortedHighlights = [...allHighlights].sort(
      (a, b) => a.start - b.start,
    );
    const result: (string | React.ReactElement)[] = [];
    let lastIndex = 0;

    sortedHighlights.forEach((highlight, index) => {
      result.push(content.slice(lastIndex, highlight.start));

      let highlightColor, borderColor;

      if (highlight.label === "temp-selection") {
        if (colorMode === "dark") {
          highlightColor = "#1a4d66";
          borderColor = "#2d6b8a";
        } else {
          highlightColor = "#add8e6";
          borderColor = "#87ceeb";
        }
      } else if (highlight.label === "irrelevant") {
        if (colorMode === "dark") {
          highlightColor = "#4d1a1a";
          borderColor = "#6b2d2d";
        } else {
          highlightColor = "#f8d7da";
          borderColor = "#f5c6cb";
        }
      } else {
        if (colorMode === "dark") {
          highlightColor = "#1a4d1a";
          borderColor = "#2d6b2d";
        } else {
          highlightColor = "#d4edda";
          borderColor = "#c3e6cb";
        }
      }

      result.push(
        <span
          key={`highlight-${index}`}
          style={{
            backgroundColor: highlightColor,
            padding: "2px 4px",
            borderRadius: "3px",
            border: `1px solid ${borderColor}`,
          }}
          title={
            highlight.label === "temp-selection"
              ? "Selected text"
              : `Chunk: ${highlight.label}${highlight.groundTruthLabel ? `, Ground Truth: ${highlight.groundTruthLabel}` : ""}`
          }
        >
          {highlight.text}
        </span>,
      );

      lastIndex = highlight.end;
    });

    result.push(content.slice(lastIndex));
    return result;
  };

  const labelingOptions = [
    {
      id: "relevant",
      label: "Relevant",
    },
    {
      id: "irrelevant",
      label: "Irrelevant",
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="h6" component="div" sx={{ mb: 1 }}>
          Label document chunks for RAG
        </Typography>
        <Typography variant="body2">
          Load a document and highlight text chunks to label them for chunk
          extraction/retrieval. Add prompt and query context, then provide
          ground truth labels for generation evaluation.
        </Typography>
      </Alert>

      <Box sx={{ my: 3 }} />

      <Stack direction="row" spacing={2}>
        <Box sx={{ flexGrow: 1 }}>
          <FormControl fullWidth>
            <FormLabel>Document file path</FormLabel>
            <TextField
              placeholder="./src/your-document.txt"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              variant="outlined"
            />
          </FormControl>
        </Box>
        <Box sx={{ flexShrink: 0 }}>
          <FormControl>
            <Button
              variant="contained"
              onClick={loadDocument}
              disabled={!filePath || isLoading}
              startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
              sx={{ mt: 3 }}
            >
              Load Document
            </Button>
          </FormControl>
        </Box>
      </Stack>

      <Box sx={{ my: 3 }} />

      {isLoading && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ flexShrink: 0 }}>
            <CircularProgress size="medium" />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body1">Loading document...</Typography>
          </Box>
        </Stack>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" component="div" sx={{ mb: 1 }}>
            Error loading document
          </Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      {documentContent && (
        <>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">RAG Context</Typography>

            <Stack direction="row" spacing={2}>
              <Box sx={{ flexGrow: 1 }}>
                <FormControl fullWidth>
                  <FormLabel>Prompt</FormLabel>
                  <TextField
                    multiline
                    placeholder="Enter system prompt..."
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    rows={3}
                    fullWidth
                    variant="outlined"
                    helperText="System context for the RAG system"
                  />
                </FormControl>
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <FormControl fullWidth>
                  <FormLabel>Query</FormLabel>
                  <TextField
                    multiline
                    placeholder="Enter user query..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    rows={3}
                    fullWidth
                    variant="outlined"
                    helperText="User query for retrieval testing"
                  />
                </FormControl>
              </Box>
            </Stack>
          </Paper>

          <Box sx={{ my: 3 }} />

          <Typography variant="h6">
            Step 1: Label for Chunk Extraction
          </Typography>
          <Box sx={{ my: 2 }} />

          <Stack direction="row" spacing={2}>
            <Box sx={{ flexGrow: 1 }}>
              <FormControl>
                <FormLabel>Chunk extraction label</FormLabel>
                <ToggleButtonGroup
                  value={labelingMode}
                  exclusive
                  onChange={(_, value) => value && setLabelingMode(value)}
                  size="small"
                >
                  {labelingOptions.map((option) => (
                    <ToggleButton key={option.id} value={option.id}>
                      {option.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </FormControl>
            </Box>
            <Box sx={{ flexShrink: 0 }}>
              <FormControl>
                <Button
                  variant="contained"
                  onClick={handleLabelSelection}
                  disabled={!selectedText}
                  sx={{ mt: 3 }}
                >
                  Label Selected Text
                </Button>
              </FormControl>
            </Box>
          </Stack>

          <Box sx={{ my: 3 }} />

          {selectedText && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" component="div" sx={{ mb: 1 }}>
                Text selected for labeling
              </Typography>
              <Typography
                sx={{
                  fontFamily: "monospace",
                  bgcolor: "grey.100",
                  px: 0.5,
                  borderRadius: 1,
                  display: "inline",
                }}
              >
                {selectedText.text}
              </Typography>
            </Alert>
          )}

          <Box sx={{ my: 2 }} />

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Document Content</Typography>

            <Typography variant="body1">
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  lineHeight: "1.6",
                  userSelect: "text",
                  cursor: "text",
                }}
                onMouseUp={handleTextSelection}
              >
                {renderDocumentWithHighlights(documentContent.content)}
              </div>
            </Typography>
          </Paper>

          <Box sx={{ my: 3 }} />

          <Typography variant="h6">Step 2: Label for Generation</Typography>
          <Box sx={{ my: 2 }} />

          <FormControl fullWidth>
            <FormLabel>Ground Truth Label</FormLabel>
            <TextField
              multiline
              placeholder="Enter ground truth label for generation evaluation..."
              value={groundTruthLabel}
              onChange={(e) => {
                setGroundTruthLabel(e.target.value);
                setHasUnsavedChanges(true);
              }}
              rows={3}
              fullWidth
              variant="outlined"
              helperText="Text for generation evaluation"
            />
          </FormControl>

          <Box sx={{ my: 2 }} />

          <Stack direction="row" justifyContent="flex-end">
            <Box sx={{ flexShrink: 0 }}>
              <Button
                variant="contained"
                color="success"
                onClick={saveLabels}
                disabled={
                  labels.length === 0 && !groundTruthLabel && !prompt && !query
                }
                startIcon={isSaving ? <CircularProgress size={16} /> : <Save />}
              >
                Save Labels
              </Button>
            </Box>
          </Stack>

          <Box sx={{ my: 2 }} />

          {(labels.length > 0 || groundTruthLabel || prompt || query) && (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" component="div" sx={{ mb: 1 }}>
                  Ready to save
                </Typography>
                <Typography variant="body2">
                  Click "Save Labels" to download your labeled data as a JSON
                  file.
                </Typography>
              </Alert>
              <Box sx={{ my: 2 }} />
            </>
          )}

          <Box sx={{ my: 2 }} />

          {hasUnsavedChanges && (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" component="div" sx={{ mb: 1 }}>
                  Unsaved changes
                </Typography>
                <Typography variant="body2">
                  You have unsaved changes. Click "Save Labels" to persist your
                  work.
                </Typography>
              </Alert>
              <Box sx={{ my: 2 }} />
            </>
          )}

          {labels.length > 0 && (
            <>
              <Box sx={{ my: 3 }} />
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6">
                  Extracted Chunk Labels ({labels.length})
                </Typography>

                {labels.map((label, index) => (
                  <Stack
                    key={index}
                    direction="row"
                    alignItems="center"
                    spacing={1}
                  >
                    <Box sx={{ flexShrink: 0 }}>
                      <Typography
                        sx={{
                          fontFamily: "monospace",
                          bgcolor:
                            label.label === "relevant"
                              ? "success.light"
                              : "error.light",
                          color:
                            label.label === "relevant"
                              ? "success.dark"
                              : "error.dark",
                          px: 0.5,
                          borderRadius: 1,
                          display: "inline",
                        }}
                      >
                        Chunk: {label.label}
                      </Typography>
                    </Box>
                    {label.groundTruthLabel && (
                      <Box sx={{ flexShrink: 0 }}>
                        <Typography
                          sx={{
                            fontFamily: "monospace",
                            bgcolor: "primary.light",
                            color: "primary.dark",
                            px: 0.5,
                            borderRadius: 1,
                            display: "inline",
                          }}
                        >
                          GT: {label.groundTruthLabel}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2">
                        "{label.text.substring(0, 80)}
                        {label.text.length > 80 ? "..." : ""}"
                      </Typography>
                    </Box>
                    <Box sx={{ flexShrink: 0 }}>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleRemoveLabel(index)}
                      >
                        Remove
                      </Button>
                    </Box>
                  </Stack>
                ))}
              </Paper>
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default RagTab;
