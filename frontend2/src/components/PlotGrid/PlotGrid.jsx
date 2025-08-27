// src/components/PlotGrid/PlotGrid.jsx
import React from "react";
import { ConvergencePlot } from "./ConvergencePlot";
import { AccuracyPlot } from "./AccuracyPlot";
import { PerformancePlot } from "./PerformancePlot";
import { ErrorDistribution } from "./ErrorDistribution";
import "./PlotGrid.css";

export function PlotGrid({
  convergenceData,
  accuracyData,
  performanceData,
  errorDistribution,
  plotStats,
}) {
  return (
    <div className='plot-grid'>
      <div className='plot-grid__item'>
        <ConvergencePlot data={convergenceData} />
      </div>
      <div className='plot-grid__item'>
        <AccuracyPlot data={accuracyData} />
      </div>
      <div className='plot-grid__item'>
        <PerformancePlot data={performanceData} />
      </div>
      <div className='plot-grid__item'>
        <ErrorDistribution
          data={errorDistribution}
          stats={plotStats.errorStats}
        />
      </div>
    </div>
  );
}
