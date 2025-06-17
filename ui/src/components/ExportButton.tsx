import React, { useState } from "react";
import { Button, Popover, MenuList, MenuItem } from "@mui/material";

interface ExportButtonProps {
  data: any[];
  fileName: string;
  formats?: ("json" | "csv")[];
}

const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  fileName,
  formats = ["json", "csv"],
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const exportData = (format: "json" | "csv") => {
    let content = "";
    let mimeType = "";

    if (format === "json") {
      content = JSON.stringify(data, null, 2);
      mimeType = "application/json";
    } else {
      const headers = Object.keys(data[0] || {}).join(",") + "\n";
      const rows = data.map((item) => Object.values(item).join(",")).join("\n");
      content = headers + rows;
      mimeType = "text/csv";
    }

    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportMenu = (
    <MenuList>
      {formats.map((format) => (
        <MenuItem key={format} onClick={() => exportData(format)}>
          Export {format.toUpperCase()}
        </MenuItem>
      ))}
    </MenuList>
  );

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setIsPopoverOpen(!isPopoverOpen);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setIsPopoverOpen(false);
  };

  return (
    <>
      <Button color="primary" variant="contained" onClick={handleClick}>
        Export
      </Button>
      <Popover
        open={isPopoverOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        {exportMenu}
      </Popover>
    </>
  );
};
export default ExportButton;
