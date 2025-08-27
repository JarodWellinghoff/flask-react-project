// src/components/PlotGrid/ConvergencePlot.jsx
"use client";
import React, { use } from "react";
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

export function ConvergencePlot({ data }) {
  return (
    <div className='plot'>
      <h3 className='plot__title'>Convergence (Loss over Time)</h3>
      <ResponsiveContainer width='100%' height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis
            dataKey='x'
            label={{ value: "Iteration", position: "insideBottom", offset: -5 }}
          />
          <YAxis
            label={{ value: "Loss", angle: -90, position: "insideLeft" }}
          />
          <Tooltip />
          <Legend />
          <Line
            type='monotone'
            dataKey='loss'
            stroke='#3B82F6'
            strokeWidth={2}
            dot={false}
          />
          <Line
            type='monotone'
            dataKey='val_loss'
            stroke='#EF4444'
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
