// src/components/PlotGrid/ErrorDistribution.tsx
import React from "react";
import { Typography, Box, Stack, Chip } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ErrorDistributionProps {
  data: any[];
  stats?: {
    mean?: number;
    std?: number;
    min?: number;
    max?: number;
  };
}

export function ErrorDistribution({ data, stats }: ErrorDistributionProps) {
  return (
    <Box sx={{ height: "100%" }}>
      <Typography variant='h6' component='h3' sx={{ mb: 2, fontWeight: 600 }}>
        Error Distribution
      </Typography>
      <Box sx={{ height: 250 }}>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart data={data} margin={{ bottom: 50 }}>
            <CartesianGrid strokeDasharray='3 3' stroke='#e0e0e0' />
            <XAxis
              dataKey='range'
              angle={-45}
              textAnchor='end'
              height={60}
              interval={0}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              label={{ value: "Count", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Bar dataKey='count' fill='#6366F1' radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
      {stats && (
        <Stack
          direction='row'
          spacing={1}
          sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
          <Chip
            label={`μ = ${stats.mean?.toFixed(3)}`}
            size='small'
            variant='outlined'
            color='primary'
          />
          <Chip
            label={`σ = ${stats.std?.toFixed(3)}`}
            size='small'
            variant='outlined'
            color='secondary'
          />
          <Chip
            label={`min = ${stats.min?.toFixed(3)}`}
            size='small'
            variant='outlined'
            color='success'
          />
          <Chip
            label={`max = ${stats.max?.toFixed(3)}`}
            size='small'
            variant='outlined'
            color='error'
          />
        </Stack>
      )}
    </Box>
  );
}
