// src/components/PlotGrid/PerformancePlot.jsx
import React from "react";
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

export function PerformancePlot({ data }) {
  // Custom tooltip to show all values
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className='custom-tooltip'>
          <p className='label'>{`Time: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value.toFixed(2)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className='plot'>
      <h3 className='plot__title'>Performance Metrics (Last 20)</h3>
      <ResponsiveContainer width='100%' height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray='3 3' />
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
          {/* Add secondary Y axes for different scales */}
          <YAxis yAxisId='memory' orientation='right' hide />
          <YAxis yAxisId='cpu' orientation='right' hide />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
