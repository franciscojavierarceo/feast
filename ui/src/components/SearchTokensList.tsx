import React from "react";
import { Chip, Stack, Box } from "@mui/material";
import { Close } from "@mui/icons-material";

interface SearchTokensListProps {
  tokens: string[];
  removeTokenByPosition: (tokenPosition: number) => void;
}

const SearchTokensList = ({
  tokens,
  removeTokenByPosition,
}: SearchTokensListProps) => {
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap">
      {tokens.map((token, index) => {
        const chipColor = token.indexOf(":") > 0 ? "primary" : "default";

        return (
          <Box key={token}>
            <Chip
              label={token}
              color={chipColor}
              onDelete={() => {
                removeTokenByPosition(index);
              }}
              deleteIcon={<Close />}
            />
          </Box>
        );
      })}
    </Stack>
  );
};

export default SearchTokensList;
