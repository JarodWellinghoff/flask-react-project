// src/components/ResultsSummary/ResultsSummary.jsx
import React from "react";
import "./ResultsSummary.css";

export function ResultsSummary({ summary }) {
  if (!summary) return null;

  return (
    <div className='results-summary'>
      <h3 className='results-summary__title'>Final Results</h3>
      <div className='results-summary__grid'>
        <div className='results-summary__item results-summary__item--blue'>
          <div className='results-summary__label'>Final Loss</div>
          <div className='results-summary__value'>
            {summary.final_loss?.toFixed(4)}
          </div>
        </div>
        <div className='results-summary__item results-summary__item--green'>
          <div className='results-summary__label'>Final Accuracy</div>
          <div className='results-summary__value'>
            {summary.final_accuracy?.toFixed(2)}%
          </div>
        </div>
        <div className='results-summary__item results-summary__item--purple'>
          <div className='results-summary__label'>Avg Throughput</div>
          <div className='results-summary__value'>
            {summary.avg_throughput?.toFixed(0)} ops/s
          </div>
        </div>
      </div>
    </div>
  );
}
