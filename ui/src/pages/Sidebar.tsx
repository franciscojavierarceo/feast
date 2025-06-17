import React, { useContext, useState } from "react";

import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Collapse } from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { Link, useParams } from "react-router-dom";
import { useMatchSubpath } from "../hooks/useMatchSubpath";
import useLoadRegistry from "../queries/useLoadRegistry";
import RegistryPathContext from "../contexts/RegistryPathContext";

import { DataSourceIcon } from "../graphics/DataSourceIcon";
import { EntityIcon } from "../graphics/EntityIcon";
import { FeatureViewIcon } from "../graphics/FeatureViewIcon";
import { FeatureServiceIcon } from "../graphics/FeatureServiceIcon";
import { DatasetIcon } from "../graphics/DatasetIcon";
import { FeatureIcon } from "../graphics/FeatureIcon";
import { HomeIcon } from "../graphics/HomeIcon";
import { PermissionsIcon } from "../graphics/PermissionsIcon";

const SideNav = () => {
  const registryUrl = useContext(RegistryPathContext);
  const { isSuccess, data } = useLoadRegistry(registryUrl);
  const { projectName } = useParams();

  const [isSideNavOpenOnMobile, setisSideNavOpenOnMobile] = useState(false);

  const toggleOpenOnMobile = () => {
    setisSideNavOpenOnMobile(!isSideNavOpenOnMobile);
  };

  const dataSourcesLabel = `Data Sources ${
    isSuccess && data?.objects.dataSources
      ? `(${data?.objects.dataSources?.length})`
      : ""
  }`;

  const entitiesLabel = `Entities ${
    isSuccess && data?.objects.entities
      ? `(${data?.objects.entities?.length})`
      : ""
  }`;

  const featureViewsLabel = `Feature Views ${
    isSuccess && data?.mergedFVList && data?.mergedFVList.length > 0
      ? `(${data?.mergedFVList.length})`
      : ""
  }`;

  const featureListLabel = `Features ${
    isSuccess && data?.allFeatures && data?.allFeatures.length > 0
      ? `(${data?.allFeatures.length})`
      : ""
  }`;

  const featureServicesLabel = `Feature Services ${
    isSuccess && data?.objects.featureServices
      ? `(${data?.objects.featureServices?.length})`
      : ""
  }`;

  const savedDatasetsLabel = `Datasets ${
    isSuccess && data?.objects.savedDatasets
      ? `(${data?.objects.savedDatasets?.length})`
      : ""
  }`;

  const baseUrl = `/p/${projectName}`;

  const [resourcesOpen, setResourcesOpen] = useState(true);

  return (
    <List component="nav" aria-label="Project Level">
      <ListItem>
        <ListItemButton component={Link} to={`${baseUrl}`} selected={useMatchSubpath(`${baseUrl}$`)}>
          <ListItemIcon>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Home" />
        </ListItemButton>
      </ListItem>
      
      <ListItem>
        <ListItemButton onClick={() => setResourcesOpen(!resourcesOpen)}>
          <ListItemText primary="Resources" />
          {resourcesOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
      </ListItem>
      
      <Collapse in={resourcesOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItem sx={{ pl: 4 }}>
            <ListItemButton component={Link} to={`${baseUrl}/lineage`} selected={useMatchSubpath(`${baseUrl}/lineage`)}>
              <ListItemIcon>
                <DataSourceIcon />
              </ListItemIcon>
              <ListItemText primary="Lineage" />
            </ListItemButton>
          </ListItem>
          
          <ListItem sx={{ pl: 4 }}>
            <ListItemButton component={Link} to={`${baseUrl}/data-source`} selected={useMatchSubpath(`${baseUrl}/data-source`)}>
              <ListItemIcon>
                <DataSourceIcon />
              </ListItemIcon>
              <ListItemText primary={dataSourcesLabel} />
            </ListItemButton>
          </ListItem>
          
          <ListItem sx={{ pl: 4 }}>
            <ListItemButton component={Link} to={`${baseUrl}/entity`} selected={useMatchSubpath(`${baseUrl}/entity`)}>
              <ListItemIcon>
                <EntityIcon />
              </ListItemIcon>
              <ListItemText primary={entitiesLabel} />
            </ListItemButton>
          </ListItem>
          
          <ListItem sx={{ pl: 4 }}>
            <ListItemButton component={Link} to={`${baseUrl}/features`} selected={useMatchSubpath(`${baseUrl}/features`)}>
              <ListItemIcon>
                <FeatureIcon />
              </ListItemIcon>
              <ListItemText primary={featureListLabel} />
            </ListItemButton>
          </ListItem>
          
          <ListItem sx={{ pl: 4 }}>
            <ListItemButton component={Link} to={`${baseUrl}/feature-view`} selected={useMatchSubpath(`${baseUrl}/feature-view`)}>
              <ListItemIcon>
                <FeatureViewIcon />
              </ListItemIcon>
              <ListItemText primary={featureViewsLabel} />
            </ListItemButton>
          </ListItem>
          
          <ListItem sx={{ pl: 4 }}>
            <ListItemButton component={Link} to={`${baseUrl}/feature-service`} selected={useMatchSubpath(`${baseUrl}/feature-service`)}>
              <ListItemIcon>
                <FeatureServiceIcon />
              </ListItemIcon>
              <ListItemText primary={featureServicesLabel} />
            </ListItemButton>
          </ListItem>
          
          <ListItem sx={{ pl: 4 }}>
            <ListItemButton component={Link} to={`${baseUrl}/data-set`} selected={useMatchSubpath(`${baseUrl}/data-set`)}>
              <ListItemIcon>
                <DatasetIcon />
              </ListItemIcon>
              <ListItemText primary={savedDatasetsLabel} />
            </ListItemButton>
          </ListItem>
          
          <ListItem sx={{ pl: 4 }}>
            <ListItemButton component={Link} to={`${baseUrl}/data-labeling`} selected={useMatchSubpath(`${baseUrl}/data-labeling`)}>
              <ListItemIcon>
                <DataSourceIcon />
              </ListItemIcon>
              <ListItemText primary="Data Labeling" />
            </ListItemButton>
          </ListItem>
          
          <ListItem sx={{ pl: 4 }}>
            <ListItemButton component={Link} to={`${baseUrl}/permissions`} selected={useMatchSubpath(`${baseUrl}/permissions`)}>
              <ListItemIcon>
                <PermissionsIcon />
              </ListItemIcon>
              <ListItemText primary="Permissions" />
            </ListItemButton>
          </ListItem>
        </List>
      </Collapse>
    </List>
  );
};

export default SideNav;
