// src/components/ProgressBar/BatchProgressBar.jsx
import React from "react";
import { DataTransformService } from "../../services/dataTransform";
import "./BatchProgressBar.css";

export function BatchProgressBar({
  // Single mode props
  progress = 0,
  elapsedTime = 0,
  messageCount = 0,
  dataTransferred = 0,

  // Batch mode props
  isBatchMode = false,
  batchProgress = 0,
  totalTests = 0,
  completedTests = 0,
  currentTestIndex = 0,
  currentTestProgress = 0,
  currentTestName = "",
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const displayProgress = isBatchMode ? batchProgress : progress;
  const showCurrentTest = isBatchMode && totalTests > 1;

  return (
    <div className='batch-progress-bar'>
      {/* Main Progress Bar */}
      <div className='batch-progress-bar__main'>
        <div className='batch-progress-bar__track'>
          <div
            className='batch-progress-bar__fill'
            style={{ width: `${displayProgress}%` }}>
            <span className='batch-progress-bar__text'>{displayProgress}%</span>
          </div>
        </div>

        <div className='batch-progress-bar__label'>
          {isBatchMode
            ? `Batch Progress (${completedTests}/${totalTests} tests completed)`
            : "Calculation Progress"}
        </div>
      </div>

      {/* Current Test Progress (Batch Mode Only) */}
      {showCurrentTest && (
        <div className='batch-progress-bar__current-test'>
          <div className='batch-progress-bar__current-test-header'>
            <span className='batch-progress-bar__current-test-name'>
              Current: {currentTestName || `Test ${currentTestIndex + 1}`}
            </span>
            <span className='batch-progress-bar__current-test-progress'>
              {currentTestProgress}%
            </span>
          </div>
          <div className='batch-progress-bar__track batch-progress-bar__track--small'>
            <div
              className='batch-progress-bar__fill batch-progress-bar__fill--secondary'
              style={{ width: `${currentTestProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      <div className='batch-progress-bar__stats'>
        <div className='stat'>
          <span className='stat__label'>Elapsed:</span>
          <span className='stat__value'>{formatTime(elapsedTime)}</span>
        </div>

        {isBatchMode ? (
          <>
            <div className='stat'>
              <span className='stat__label'>Completed Tests:</span>
              <span className='stat__value'>{completedTests}</span>
            </div>
            <div className='stat'>
              <span className='stat__label'>Remaining Tests:</span>
              <span className='stat__value'>{totalTests - completedTests}</span>
            </div>
            <div className='stat'>
              <span className='stat__label'>Current Test:</span>
              <span className='stat__value'>{currentTestIndex + 1}</span>
            </div>
          </>
        ) : (
          <>
            <div className='stat'>
              <span className='stat__label'>Messages:</span>
              <span className='stat__value'>{messageCount}</span>
            </div>
            <div className='stat'>
              <span className='stat__label'>Data transferred:</span>
              <span className='stat__value'>
                {DataTransformService.formatBytes(dataTransferred)}
              </span>
            </div>
            <div className='stat'>
              <span className='stat__label'>Efficiency:</span>
              <span className='stat__value'>
                {messageCount > 0
                  ? `${(dataTransferred / messageCount).toFixed(0)} bytes/msg`
                  : "0 bytes/msg"}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Test Queue Visualization (Batch Mode Only) */}
      {isBatchMode && totalTests > 1 && (
        <div className='batch-progress-bar__queue'>
          <div className='test-queue'>
            {Array(totalTests)
              .fill(0)
              .map((_, index) => (
                <div
                  key={index}
                  className={`test-queue__item ${getTestStatus(
                    index,
                    completedTests,
                    currentTestIndex
                  )}`}>
                  <div className='test-queue__item-number'>{index + 1}</div>
                  <div className='test-queue__item-status'>
                    {getTestStatusText(index, completedTests, currentTestIndex)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getTestStatus(testIndex, completedTests, currentTestIndex) {
  if (testIndex < completedTests) {
    return "test-queue__item--completed";
  } else if (testIndex === currentTestIndex) {
    return "test-queue__item--running";
  } else {
    return "test-queue__item--pending";
  }
}

function getTestStatusText(testIndex, completedTests, currentTestIndex) {
  if (testIndex < completedTests) {
    return "Done";
  } else if (testIndex === currentTestIndex) {
    return "Running";
  } else {
    return "Waiting";
  }
}
