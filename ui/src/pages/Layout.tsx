import React, { useState, useRef, useEffect } from "react";

import { Box, Drawer, Divider, Stack } from "@mui/material";
import { ErrorBoundary } from "react-error-boundary";
import { Outlet } from "react-router-dom";

import RegistryPathContext from "../contexts/RegistryPathContext";
import { useParams } from "react-router-dom";
import { useLoadProjectsList } from "../contexts/ProjectListContext";
import useLoadRegistry from "../queries/useLoadRegistry";

import ProjectSelector from "../components/ProjectSelector";
import Sidebar from "./Sidebar";
import FeastWordMark from "../graphics/FeastWordMark";
import ThemeToggle from "../components/ThemeToggle";
import RegistrySearch, {
  RegistrySearchRef,
} from "../components/RegistrySearch";
import GlobalSearchShortcut from "../components/GlobalSearchShortcut";
import CommandPalette from "../components/CommandPalette";

const Layout = () => {
  // Registry Path Context has to be inside Layout
  // because it has to be under routes
  // in order to use useParams
  let { projectName } = useParams();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const searchRef = useRef<RegistrySearchRef>(null);

  const { data: projectsData } = useLoadProjectsList();

  const currentProject = projectsData?.projects.find((project) => {
    return project.id === projectName;
  });

  const registryPath = currentProject?.registryPath || "";
  const { data } = useLoadRegistry(registryPath);

  const categories = data
    ? [
        {
          name: "Data Sources",
          data: data.objects.dataSources || [],
          getLink: (item: any) => `/p/${projectName}/data-source/${item.name}`,
        },
        {
          name: "Entities",
          data: data.objects.entities || [],
          getLink: (item: any) => `/p/${projectName}/entity/${item.name}`,
        },
        {
          name: "Features",
          data: data.allFeatures || [],
          getLink: (item: any) => {
            const featureView = item?.featureView;
            return featureView
              ? `/p/${projectName}/feature-view/${featureView}/feature/${item.name}`
              : "#";
          },
        },
        {
          name: "Feature Views",
          data: data.mergedFVList || [],
          getLink: (item: any) => `/p/${projectName}/feature-view/${item.name}`,
        },
        {
          name: "Feature Services",
          data: data.objects.featureServices || [],
          getLink: (item: any) => {
            const serviceName = item?.name || item?.spec?.name;
            return serviceName
              ? `/p/${projectName}/feature-service/${serviceName}`
              : "#";
          },
        },
      ]
    : [];

  const handleSearchOpen = () => {
    console.log("Opening command palette - before state update"); // Debug log
    setIsCommandPaletteOpen(true);
    console.log("Command palette state should be updated to true");
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log(
        "Layout key pressed:",
        event.key,
        "metaKey:",
        event.metaKey,
        "ctrlKey:",
        event.ctrlKey,
      );
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        console.log("Layout detected Cmd+K, preventing default");
        event.preventDefault();
        event.stopPropagation();
        handleSearchOpen();
      }
    };

    console.log("Layout adding keydown event listener");
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  return (
    <RegistryPathContext.Provider value={registryPath}>
      <GlobalSearchShortcut onOpen={handleSearchOpen} />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        categories={categories}
      />
      <Box sx={{ display: "flex", height: "100vh" }}>
        <Drawer
          variant="permanent"
          role="navigation"
          aria-label="Top Level"
          sx={{
            width: 240,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: 240,
              boxSizing: "border-box",
              padding: 3,
            },
          }}
        >
          <FeastWordMark />
          <Box sx={{ mt: 1 }} />
          <ProjectSelector />
          {registryPath && (
            <React.Fragment>
              <Divider sx={{ my: 1 }} />
              <Sidebar />
              <Box sx={{ mt: 3 }} />
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                <ThemeToggle />
              </Box>
            </React.Fragment>
          )}
        </Drawer>

        <Box
          component="main"
          sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
        >
          <ErrorBoundary fallback={<div>Something went wrong</div>}>
            {data && (
              <Box
                sx={{
                  position: "sticky",
                  top: 0,
                  zIndex: 100,
                  bgcolor: "background.paper",
                  borderBottom: 1,
                  borderColor: "divider",
                  boxShadow: 1,
                  p: 2,
                }}
              >
                <Stack direction="row" justifyContent="center">
                  <Box sx={{ width: "600px", maxWidth: "90%" }}>
                    <RegistrySearch ref={searchRef} categories={categories} />
                  </Box>
                </Stack>
              </Box>
            )}
            <Box
              sx={{
                flexGrow: 1,
                overflow: "auto",
                p: 2,
                height: "calc(100vh - 70px)",
              }}
            >
              <Outlet />
            </Box>
          </ErrorBoundary>
        </Box>
      </Box>
    </RegistryPathContext.Provider>
  );
};

export default Layout;
