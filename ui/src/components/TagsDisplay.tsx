import React from "react";
import { Typography, Box } from "@mui/material";
import CustomLink from "./CustomLink";

interface TagsDisplayProps {
  createLink?: (key: string, value: string) => string;
  tags: Record<string, string>;
  owner?: string;
  description?: string;
}

const TagsDisplay = ({
  tags,
  createLink,
  owner,
  description,
}: TagsDisplayProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {owner ? (
        <Box key={"owner"}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>owner</Typography>
          <Typography variant="body2">{owner}</Typography>
        </Box>
      ) : null}
      {description ? (
        <Box key={"description"}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>description</Typography>
          <Typography variant="body2">
            {description}
          </Typography>
        </Box>
      ) : null}
      {Object.entries(tags).map(([key, value]) => {
        return (
          <Box key={key}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{key}</Typography>
            <Typography variant="body2">
              {createLink ? (
                <CustomLink to={createLink(key, value)}>
                  {value}
                </CustomLink>
              ) : (
                value
              )}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default TagsDisplay;
