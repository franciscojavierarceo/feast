import React, { useContext } from "react";
import {
  Container,
  Box,
  Typography,
  Stack,
  Skeleton,
  Alert,
  TextField,
} from "@mui/material";

import { useDocumentTitle } from "../hooks/useDocumentTitle";
import ObjectsCountStats from "../components/ObjectsCountStats";
import ExplorePanel from "../components/ExplorePanel";
import useLoadRegistry from "../queries/useLoadRegistry";
import RegistryPathContext from "../contexts/RegistryPathContext";
import RegistryVisualizationTab from "../components/RegistryVisualizationTab";
import RegistrySearch from "../components/RegistrySearch";
import { useParams } from "react-router-dom";

const ProjectOverviewPage = () => {
  useDocumentTitle("Feast Home");
  const registryUrl = useContext(RegistryPathContext);
  const { isLoading, isSuccess, isError, data } = useLoadRegistry(registryUrl);

  const { projectName } = useParams<{ projectName: string }>();

  const categories = [
    {
      name: "Data Sources",
      data: data?.objects.dataSources || [],
      getLink: (item: any) => `/p/${projectName}/data-source/${item.name}`,
    },
    {
      name: "Entities",
      data: data?.objects.entities || [],
      getLink: (item: any) => `/p/${projectName}/entity/${item.name}`,
    },
    {
      name: "Features",
      data: data?.allFeatures || [],
      getLink: (item: any) => {
        const featureView = item?.featureView;
        return featureView
          ? `/p/${projectName}/feature-view/${featureView}/feature/${item.name}`
          : "#";
      },
    },
    {
      name: "Feature Views",
      data: data?.mergedFVList || [],
      getLink: (item: any) => `/p/${projectName}/feature-view/${item.name}`,
    },
    {
      name: "Feature Services",
      data: data?.objects.featureServices || [],
      getLink: (item: any) => {
        const serviceName = item?.name || item?.spec?.name;
        return serviceName
          ? `/p/${projectName}/feature-service/${serviceName}`
          : "#";
      },
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isLoading && <Skeleton width="50%" />}
          {isSuccess && data?.project && `Project: ${data.project}`}
        </Typography>

        <Stack direction="row" spacing={3} sx={{ mt: 3 }}>
          <Box sx={{ flexGrow: 2 }}>
            {isLoading && <Skeleton variant="rectangular" height={200} />}
            {isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Error Loading Project Configs
                </Typography>
                <Typography>
                  There was an error loading the Project Configurations.
                  Please check that <code>feature_store.yaml</code> file is
                  available and well-formed.
                </Typography>
              </Alert>
            )}
            {isSuccess &&
              (data?.description ? (
                <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {data.description}
                </Typography>
              ) : (
                <Box>
                  <Typography paragraph>
                    Welcome to your new Feast project. In this UI, you can see
                    Data Sources, Entities, Features, Feature Views, and Feature
                    Services registered in Feast.
                  </Typography>
                  <Typography paragraph>
                    It looks like this project already has some objects
                    registered. If you are new to this project, we suggest
                    starting by exploring the Feature Services, as they
                    represent the collection of Feature Views serving a
                    particular model.
                  </Typography>
                  <Typography paragraph>
                    <strong>Note</strong>: We encourage you to replace this
                    welcome message with more suitable content for your team.
                    You can do so by specifying a{" "}
                    <code>project_description</code> in your{" "}
                    <code>feature_store.yaml</code> file.
                  </Typography>
                </Box>
              ))}
            <ObjectsCountStats />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <ExplorePanel />
          </Box>
        </Stack>
      </Box>
    </Container>
  );
};

export default ProjectOverviewPage;
