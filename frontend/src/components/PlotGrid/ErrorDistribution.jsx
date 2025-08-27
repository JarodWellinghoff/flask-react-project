// src/components/PlotGrid/ErrorDistribution.jsx
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function ErrorDistribution({ data, stats }) {
  return (
    <div className='plot'>
      <h3 className='plot__title'>Error Distribution</h3>
      <ResponsiveContainer width='100%' height={250}>
        <BarChart data={data} margin={{ bottom: 50 }}>
          <CartesianGrid strokeDasharray='3 3' />
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
          <Tooltip />
          <Bar dataKey='count' fill='#6366F1' radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {stats && (
        <div className='plot__stats'>
          <span>μ = {stats.mean?.toFixed(3)}</span>
          <span>σ = {stats.std?.toFixed(3)}</span>
          <span>min = {stats.min?.toFixed(3)}</span>
          <span>max = {stats.max?.toFixed(3)}</span>
        </div>
      )}
    </div>
  );
}
