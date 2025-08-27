// src/components/ControlPanel/BatchControlPanel.jsx
import React, { useState } from "react";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";

import "./ControlPanel.css";

export function BatchControlPanel({
  onStartSingle,
  onStartBatch,
  onCancel,
  onDownload,
  isRunning,
  taskId,
  isBatchMode = false,
}) {
  const customConfig = {
    dictionaries: [adjectives, colors, animals],
    separator: " ",
    length: 3,
    style: "capital",
  };
  const generateUniqueName = () => {
    return uniqueNamesGenerator(customConfig);
  };
  const [numIterations, setNumIterations] = useState(5);
  const [mode, setMode] = useState("single"); // 'single' or 'batch'
  const [batchTests, setBatchTests] = useState([
    {
      name: generateUniqueName(),
      num_iterations: 5,
      test_params: { seed: 42 },
    },
  ]);

  const handleStartSingle = () => {
    onStartSingle(numIterations, { seed: 42 });
  };

  const handleStartBatch = () => {
    const batchConfig = {
      tests: batchTests.map((test, index) => ({
        ...test,
        name: test.name || `Test ${index + 1}`,
      })),
    };
    onStartBatch(batchConfig);
  };

  const addTest = () => {
    setBatchTests([
      ...batchTests,
      {
        name: generateUniqueName(),
        num_iterations: 5,
        test_params: { seed: Math.floor(Math.random() * 1000) },
      },
    ]);
  };

  const removeTest = (index) => {
    setBatchTests(batchTests.filter((_, i) => i !== index));
  };

  const updateTest = (index, field, value) => {
    const updated = [...batchTests];
    if (field === "num_iterations") {
      updated[index][field] = parseInt(value) || 0;
    } else if (field === "seed") {
      updated[index].test_params = {
        ...updated[index].test_params,
        seed: parseInt(value) || 0,
      };
    } else {
      updated[index][field] = value;
    }
    setBatchTests(updated);
  };

  return (
    <div className='control-panel'>
      {/* Mode Selection */}
      <div className='control-panel__mode-selection'>
        <label className='mode-toggle'>
          <input
            type='radio'
            name='mode'
            value='single'
            checked={mode === "single"}
            onChange={(e) => setMode(e.target.value)}
            disabled={isRunning}
          />
          Single Calculation
        </label>
        <label className='mode-toggle'>
          <input
            type='radio'
            name='mode'
            value='batch'
            checked={mode === "batch"}
            onChange={(e) => setMode(e.target.value)}
            disabled={isRunning}
          />
          Batch Calculations
        </label>
      </div>

      {/* Single Mode Controls */}
      {mode === "single" && (
        <div className='control-panel__single-mode'>
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
        </div>
      )}

      {/* Batch Mode Controls */}
      {mode === "batch" && (
        <div className='control-panel__batch-mode'>
          <div className='batch-tests'>
            <div className='batch-tests__header'>
              <h4>Test Configurations</h4>
              <button
                onClick={addTest}
                disabled={isRunning || batchTests.length >= 5}
                className='btn btn--secondary btn--small'>
                Add Test
              </button>
            </div>

            {batchTests.map((test, index) => (
              <div key={index} className='batch-test-config'>
                <div className='batch-test-config__header'>
                  <input
                    type='text'
                    value={test.name}
                    onChange={(e) => updateTest(index, "name", e.target.value)}
                    disabled={isRunning}
                    className='batch-test-config__name'
                    placeholder={`Test ${index + 1}`}
                  />
                  {batchTests.length > 1 && (
                    <button
                      onClick={() => removeTest(index)}
                      disabled={isRunning}
                      className='btn btn--danger btn--small'>
                      ×
                    </button>
                  )}
                </div>

                <div className='batch-test-config__params'>
                  <label className='control-panel__label'>
                    Iterations:
                    <input
                      type='number'
                      value={test.num_iterations}
                      onChange={(e) =>
                        updateTest(index, "num_iterations", e.target.value)
                      }
                      min='10'
                      max='100'
                      disabled={isRunning}
                      className='control-panel__input control-panel__input--small'
                    />
                  </label>
                  <label className='control-panel__label'>
                    Seed:
                    <input
                      type='number'
                      value={test.test_params?.seed || 0}
                      onChange={(e) =>
                        updateTest(index, "seed", e.target.value)
                      }
                      disabled={isRunning}
                      className='control-panel__input control-panel__input--small'
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className='control-panel__actions'>
        {mode === "single" && (
          <button
            onClick={handleStartSingle}
            disabled={isRunning}
            className={`btn btn--primary ${isRunning ? "btn--disabled" : ""}`}>
            Start Single Calculation
          </button>
        )}
        {mode === "batch" && (
          <button
            onClick={handleStartBatch}
            disabled={isRunning || batchTests.length === 0}
            className={`btn btn--primary ${
              isRunning || batchTests.length === 0 ? "btn--disabled" : ""
            }`}>
            Start Batch ({batchTests.length} tests)
          </button>
        )}
        <button
          onClick={async (e) => {
            e.preventDefault();
            const res = await fetch(`http://localhost:5000/health`);
            const data = await res.json();
            console.log("Health Check:", data);
          }}
          className='btn btn--secondary'
          disabled={isRunning}>
          Health Check
        </button>

        {isRunning && (
          <button onClick={onCancel} className='btn btn--danger'>
            Cancel {isBatchMode ? "Batch" : "Calculation"}
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
