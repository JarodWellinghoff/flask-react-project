// src/components/PlotGrid/ConvergencePlot.tsx
"use client";
import React from "react";
import { Typography, Box } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ConvergencePlotProps {
  data: any[];
}

export function ConvergencePlot({ data }: ConvergencePlotProps) {
  return (
    <Box sx={{ height: "100%" }}>
      <Typography variant='h6' component='h3' sx={{ mb: 2, fontWeight: 600 }}>
        Convergence (Loss over Time)
      </Typography>
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray='3 3' stroke='#e0e0e0' />
            <XAxis
              dataKey='x'
              label={{
                value: "Iteration",
                position: "insideBottom",
                offset: -5,
              }}
            />
            <YAxis
              label={{ value: "Loss", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Legend />
            <Line
              type='monotone'
              dataKey='loss'
              stroke='#3B82F6'
              strokeWidth={2}
              dot={false}
              name='Training Loss'
            />
            <Line
              type='monotone'
              dataKey='val_loss'
              stroke='#EF4444'
              strokeWidth={2}
              dot={false}
              name='Validation Loss'
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
