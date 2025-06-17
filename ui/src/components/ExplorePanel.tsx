import React from "react";

import {
  Paper,
  Typography,
  Chip,
  Skeleton,
  Stack,
  Box,
  Divider,
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import useFCOExploreSuggestions from "../hooks/useFCOExploreSuggestions";

const ExplorePanel = () => {
  const { isLoading, isSuccess, data } = useFCOExploreSuggestions();

  const navigate = useNavigate();

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle2" component="h3">
        Explore this Project
      </Typography>
      <Divider sx={{ my: 0.5 }} />
      {isLoading && <Skeleton variant="text" sx={{ fontSize: '1rem' }} />}
      {isSuccess &&
        data &&
        data.map((suggestionGroup, i) => {
          return (
            <React.Fragment key={i}>
              <Typography variant="caption" component="h4">
                {suggestionGroup.title}
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {suggestionGroup.items.map((item, j) => {
                  return (
                    <Chip
                      key={j}
                      label={`${item.name} (${item.count})`}
                      color="primary"
                      onClick={() => {
                        navigate(item.link);
                      }}
                      clickable
                      size="small"
                    />
                  );
                })}
              </Stack>
              <Box sx={{ mt: 1 }} />
            </React.Fragment>
          );
        })}
    </Paper>
  );
};

export default ExplorePanel;
