// src/components/PlotGrid/AccuracyPlot.jsx
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

export function AccuracyPlot({ data }) {
  return (
    <div className='plot'>
      <h3 className='plot__title'>Model Metrics</h3>
      <ResponsiveContainer width='100%' height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis
            dataKey='x'
            label={{ value: "Iteration", position: "insideBottom", offset: -5 }}
          />
          <YAxis
            label={{ value: "Percentage", angle: -90, position: "insideLeft" }}
            domain={[0, 100]}
          />
          <Tooltip />
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
    </div>
  );
}
