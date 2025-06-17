import React, { useEffect } from "react";
import {
  Card,
  Grid,
  Box,
  Skeleton,
  Container,
  Typography,
  Divider,
  CardContent,
  CardActionArea,
} from "@mui/material";
import { useLoadProjectsList } from "../contexts/ProjectListContext";
import { useNavigate } from "react-router-dom";
import FeastIconBlue from "../graphics/FeastIconBlue";

const RootProjectSelectionPage = () => {
  const { isLoading, isSuccess, data } = useLoadProjectsList();
  const navigate = useNavigate();

  useEffect(() => {
    if (data && data.default) {
      // If a default is set, redirect there.
      navigate(`/p/${data.default}`);
    }

    if (data && data.projects.length === 1) {
      // If there is only one project, redirect there.
      navigate(`/p/${data.projects[0].id}`);
    }
  }, [data, navigate]);

  const projectCards = data?.projects.map((item, index) => {
    return (
      <Grid item xs={12} sm={6} md={4} key={index}>
        <Card>
          <CardActionArea
            onClick={() => {
              navigate(`/p/${item.id}`);
            }}
          >
            <CardContent sx={{ textAlign: "center", p: 3 }}>
              <Box sx={{ mb: 2, "& svg": { width: 64, height: 64 } }}>
                <FeastIconBlue />
              </Box>
              <Typography variant="h6" component="h2" gutterBottom>
                {item.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item?.description || ""}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
    );
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to Feast
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select one of the projects.
        </Typography>
        <Divider sx={{ my: 2 }} />
        {isLoading && <Skeleton variant="text" width="100%" />}
        {isSuccess && data?.projects && (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {projectCards}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default RootProjectSelectionPage;
