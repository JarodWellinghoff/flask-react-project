// src/components/ControlPanel/ControlPanel.jsx
import React, { useState } from "react";
import "./ControlPanel.css";

export function ControlPanel({
  onStart,
  onCancel,
  onDownload,
  isRunning,
  taskId,
}) {
  const [numIterations, setNumIterations] = useState(5);

  const handleStart = () => {
    onStart(numIterations, { seed: 42 });
  };

  return (
    <div className='control-panel'>
      <div className='control-panel__inputs'>
        <label className='control-panel__label'>
          Iterations:
          <input
            type='number'
            value={numIterations}
            onChange={(e) => setNumIterations(Number(e.target.value))}
            min='10'
            max='100'
            disabled={isRunning}
            className='control-panel__input'
          />
        </label>
      </div>

      <div className='control-panel__actions'>
        <button
          onClick={handleStart}
          disabled={isRunning}
          className={`btn btn--primary ${isRunning ? "btn--disabled" : ""}`}>
          Start Calculation
        </button>
        <button
          onClick={async (e) => {
            e.preventDefault();
            const res = await fetch(`http://localhost:5000/health`);
            const data = await res.json();
            console.log("Health Check:", data);
          }}
          className={`btn btn--secondary ${isRunning ? "btn--disabled" : ""}`}>
          Health Check
        </button>

        {isRunning && (
          <button onClick={onCancel} className='btn btn--danger'>
            Cancel
          </button>
        )}

        {taskId && !isRunning && (
          <>
            <button
              onClick={() => onDownload("json")}
              className='btn btn--success'>
              Download JSON
            </button>
            <button
              onClick={() => onDownload("csv")}
              className='btn btn--secondary'>
              Download CSV
            </button>
          </>
        )}
      </div>
    </div>
  );
}
