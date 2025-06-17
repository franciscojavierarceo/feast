import { Box, Typography, Button, Skeleton, Alert } from "@mui/material";
import React, { useContext } from "react";
import { Outlet, useParams } from "react-router-dom";
import {
  ProjectListContext,
  useLoadProjectsList,
} from "../contexts/ProjectListContext";
import ProjectSelector from "./ProjectSelector";

const NoProjectGuard = () => {
  const { projectName } = useParams();

  const { isLoading, isError, data } = useLoadProjectsList();
  const projectListContext = useContext(ProjectListContext);

  if (isLoading && !data) {
    return <Skeleton variant="text" height={60} />;
  }

  if (isError) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Error Loading Project List
          </Typography>
          <Typography variant="body1">
            {projectListContext?.isCustom ? (
              <>
                Unable to fetch project list. Check the promise provided to Feast
                UI in <Typography component="code" sx={{ fontFamily: 'monospace' }}>projectListPromise</Typography>.
              </>
            ) : (
              <>
                Unable to find
                <Typography component="code" sx={{ fontFamily: 'monospace' }}>projects-list.json</Typography>. Check that you have a project
                list file defined.
              </>
            )}
          </Typography>
        </Alert>
      </Box>
    );
  }

  const currentProject = data?.projects.find((project) => {
    return project.id === projectName;
  });

  if (currentProject === undefined) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Error Loading Project
          </Typography>
          <Typography variant="body1" gutterBottom>
            There is no project with id <strong>{projectName}</strong> in{" "}
            <Typography component="code" sx={{ fontFamily: 'monospace' }}>projects-list.json</Typography>. Check that you have the correct
            project id.
          </Typography>
          <Typography variant="body1" gutterBottom>
            You can also select one of the project in the following list:
          </Typography>
          <ProjectSelector />
        </Alert>
      </Box>
    );
  }

  return <Outlet />;
};

export default NoProjectGuard;
