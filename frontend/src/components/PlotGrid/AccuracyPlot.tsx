// src/components/PlotGrid/AccuracyPlot.tsx
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

interface AccuracyPlotProps {
  data: any[];
}

export function AccuracyPlot({ data }: AccuracyPlotProps) {
  return (
    <Box sx={{ height: "100%" }}>
      <Typography variant='h6' component='h3' sx={{ mb: 2, fontWeight: 600 }}>
        Model Metrics
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
              label={{
                value: "Percentage",
                angle: -90,
                position: "insideLeft",
              }}
              domain={[0, 100]}
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
              dataKey='accuracy'
              stroke='#10B981'
              strokeWidth={2}
              dot={false}
              name='Accuracy'
            />
            <Line
              type='monotone'
              dataKey='precision'
              stroke='#F59E0B'
              strokeWidth={2}
              dot={false}
              name='Precision'
            />
            <Line
              type='monotone'
              dataKey='recall'
              stroke='#8B5CF6'
              strokeWidth={2}
              dot={false}
              name='Recall'
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
