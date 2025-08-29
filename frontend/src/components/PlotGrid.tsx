// src/components/PlotGrid/PlotGrid.tsx
import React from "react";
import { Grid, Card, CardContent } from "@mui/material";
import { ConvergencePlot } from "./PlotGrid/ConvergencePlot";
import { AccuracyPlot } from "./PlotGrid/AccuracyPlot";
import { PerformancePlot } from "./PlotGrid/PerformancePlot";
import { ErrorDistribution } from "./PlotGrid/ErrorDistribution";

interface PlotGridProps {
  convergenceData: any[];
  accuracyData: any[];
  performanceData: any[];
  errorDistribution: any[];
  plotStats: {
    errorStats?: {
      mean?: number;
      std?: number;
      min?: number;
      max?: number;
    };
  };
}

export function PlotGrid({
  convergenceData,
  accuracyData,
  performanceData,
  errorDistribution,
  plotStats,
}: PlotGridProps) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={6}>
        <Card sx={{ height: "100%" }}>
          <CardContent>
            <ConvergencePlot data={convergenceData} />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} lg={6}>
        <Card sx={{ height: "100%" }}>
          <CardContent>
            <AccuracyPlot data={accuracyData} />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} lg={6}>
        <Card sx={{ height: "100%" }}>
          <CardContent>
            <PerformancePlot data={performanceData} />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} lg={6}>
        <Card sx={{ height: "100%" }}>
          <CardContent>
            <ErrorDistribution
              data={errorDistribution}
              stats={plotStats.errorStats}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
