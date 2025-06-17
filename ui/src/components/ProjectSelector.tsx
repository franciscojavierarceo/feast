import { Select, MenuItem, FormControl, CircularProgress } from "@mui/material";
import React, { useId } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLoadProjectsList } from "../contexts/ProjectListContext";

const ProjectSelector = () => {
  const { projectName } = useParams();
  const navigate = useNavigate();

  const { isLoading, data } = useLoadProjectsList();

  const currentProject = data?.projects.find((project) => {
    return project.id === projectName;
  });

  const options = data?.projects.map((p) => {
    return {
      value: p.id,
      text: p.name,
    };
  });

  const basicSelectId = useId();
  const onChange = (e: any) => {
    navigate(`/p/${e.target.value}`);
  };

  return (
    <FormControl fullWidth>
      <Select
        id={basicSelectId}
        value={currentProject?.id || ""}
        onChange={onChange}
        displayEmpty={currentProject === undefined}
        aria-label="Select a Feast Project"
        endAdornment={isLoading ? <CircularProgress size={20} /> : null}
      >
        {options?.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.text}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ProjectSelector;
