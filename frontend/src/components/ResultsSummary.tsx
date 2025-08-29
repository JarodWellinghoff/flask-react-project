// src/components/ResultsSummary/ResultsSummary.tsx
import React from "react";
import { Card, CardContent, Typography, Grid, Box, Paper } from "@mui/material";
import {
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material";

interface ResultsSummaryProps {
  summary: {
    final_loss?: number;
    final_accuracy?: number;
    avg_throughput?: number;
  } | null;
}

export function ResultsSummary({ summary }: ResultsSummaryProps) {
  if (!summary) return null;

  const metrics = [
    {
      label: "Final Loss",
      value: summary.final_loss?.toFixed(4),
      color: "primary",
      icon: <TrendingDownIcon />,
      bgcolor: "primary.50",
      borderColor: "primary.200",
    },
    {
      label: "Final Accuracy",
      value: summary.final_accuracy
        ? `${summary.final_accuracy.toFixed(2)}%`
        : "N/A",
      color: "success",
      icon: <TrendingUpIcon />,
      bgcolor: "success.50",
      borderColor: "success.200",
    },
    {
      label: "Avg Throughput",
      value: summary.avg_throughput
        ? `${summary.avg_throughput.toFixed(0)} ops/s`
        : "N/A",
      color: "secondary",
      icon: <SpeedIcon />,
      bgcolor: "secondary.50",
      borderColor: "secondary.200",
    },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant='h5' component='h3' sx={{ mb: 3, fontWeight: 600 }}>
          Final Results
        </Typography>
        <Grid
          container
          spacing={3}
          sx={{ mb: 3, justifyContent: "space-evenly" }}>
          {metrics.map((metric, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper
                variant='outlined'
                sx={{
                  p: 3,
                  textAlign: "center",
                  bgcolor: metric.bgcolor,
                  borderColor: metric.borderColor,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 2,
                  },
                }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1,
                    color: `${metric.color}.600`,
                  }}>
                  {metric.icon}
                </Box>
                <Typography
                  variant='caption'
                  display='block'
                  sx={{
                    color: "text.secondary",
                    mb: 1,
                    textTransform: "uppercase",
                    fontWeight: 500,
                    letterSpacing: 0.5,
                  }}>
                  {metric.label}
                </Typography>
                <Typography
                  variant='h4'
                  component='div'
                  sx={{
                    fontWeight: 700,
                    color: `${metric.color}.700`,
                  }}>
                  {metric.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
