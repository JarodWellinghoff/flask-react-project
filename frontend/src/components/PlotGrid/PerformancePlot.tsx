// src/components/PlotGrid/PerformancePlot.tsx
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

interface PerformancePlotProps {
  data: any[];
}

export function PerformancePlot({ data }: PerformancePlotProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: "white",
            p: 1.5,
            border: "1px solid",
            borderColor: "grey.300",
            borderRadius: 1,
            boxShadow: 1,
          }}>
          <Typography variant='body2' sx={{ fontWeight: 600, mb: 0.5 }}>
            Time: {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant='body2' sx={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(2)}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ height: "100%" }}>
      <Typography variant='h6' component='h3' sx={{ mb: 2, fontWeight: 600 }}>
        Performance Metrics (Last 20)
      </Typography>
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray='3 3' stroke='#e0e0e0' />
            <XAxis
              dataKey='time'
              label={{ value: "Time", position: "insideBottom", offset: -5 }}
            />
            <YAxis
              label={{ value: "Value", angle: -90, position: "insideLeft" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type='monotone'
              dataKey='throughput'
              stroke='#06B6D4'
              strokeWidth={2}
              dot={false}
              name='Throughput (ops/s)'
            />
            <Line
              type='monotone'
              dataKey='memory'
              stroke='#EC4899'
              strokeWidth={2}
              dot={false}
              name='Memory (MB)'
              yAxisId='memory'
            />
            <Line
              type='monotone'
              dataKey='cpu'
              stroke='#F97316'
              strokeWidth={2}
              dot={false}
              name='CPU (%)'
              yAxisId='cpu'
            />
            <YAxis yAxisId='memory' orientation='right' hide />
            <YAxis yAxisId='cpu' orientation='right' hide />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
