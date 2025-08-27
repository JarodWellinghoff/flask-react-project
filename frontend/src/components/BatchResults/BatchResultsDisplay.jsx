// src/components/BatchResults/BatchResultsDisplay.jsx
import React, { useState } from "react";
import { PlotGrid } from "../PlotGrid/PlotGrid";
import { ResultsSummary } from "../ResultsSummary/ResultsSummary";
import "./BatchResultsDisplay.css";

export function BatchResultsDisplay({
  testResults = [],
  batchSummary = null,
  completedTests = 0,
  totalTests = 0,
}) {
  const [selectedTestIndex, setSelectedTestIndex] = useState(0);

  if (testResults.length === 0) {
    return (
      <div className='batch-results'>
        <div className='batch-results__empty'>No completed tests yet...</div>
      </div>
    );
  }

  const selectedTest = testResults[selectedTestIndex] || testResults[0];

  return (
    <div className='batch-results'>
      {/* Batch Summary */}
      {batchSummary && (
        <div className='batch-results__summary'>
          <BatchSummaryCard summary={batchSummary} />
        </div>
      )}

      {/* Test Navigation */}
      <div className='batch-results__navigation'>
        <div className='test-tabs'>
          {testResults.map((test, index) => (
            <button
              key={index}
              onClick={() => setSelectedTestIndex(index)}
              className={`test-tab ${
                selectedTestIndex === index ? "test-tab--active" : ""
              }`}>
              <div className='test-tab__name'>{test.test_name}</div>
              <div className='test-tab__accuracy'>
                {test.final_metrics?.final_accuracy?.toFixed(1)}%
              </div>
            </button>
          ))}

          {/* Show placeholder tabs for running tests */}
          {completedTests < totalTests &&
            Array(totalTests - completedTests)
              .fill(0)
              .map((_, index) => (
                <button
                  key={`pending-${index}`}
                  disabled
                  className='test-tab test-tab--pending'>
                  <div className='test-tab__name'>
                    Test {completedTests + index + 1}
                  </div>
                  <div className='test-tab__status'>Running...</div>
                </button>
              ))}
        </div>
      </div>

      {/* Selected Test Details */}
      {selectedTest && (
        <div className='batch-results__test-details'>
          <div className='test-details__header'>
            <h3>{selectedTest.test_name}</h3>
            <div className='test-details__config'>
              <span>
                Iterations: {selectedTest.test_config?.num_iterations}
              </span>
              <span>Seed: {selectedTest.test_config?.test_params?.seed}</span>
            </div>
          </div>

          {/* Individual Test Results */}
          <div className='test-details__results'>
            <ResultsSummary summary={selectedTest.final_metrics} />
          </div>

          {/* Individual Test Plots */}
          <div className='test-details__plots'>
            <PlotGrid
              convergenceData={selectedTest.complete_plots?.convergence || []}
              accuracyData={selectedTest.complete_plots?.accuracy || []}
              performanceData={selectedTest.complete_plots?.performance || []}
              errorDistribution={
                selectedTest.complete_plots?.error_distribution?.data || []
              }
              plotStats={{
                errorStats:
                  selectedTest.complete_plots?.error_distribution?.stats,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function BatchSummaryCard({ summary }) {
  return (
    <div className='batch-summary-card'>
      <h3 className='batch-summary-card__title'>Batch Summary</h3>
      <div className='batch-summary-card__grid'>
        <div className='batch-summary-card__item batch-summary-card__item--blue'>
          <div className='batch-summary-card__label'>Tests Completed</div>
          <div className='batch-summary-card__value'>{summary.total_tests}</div>
        </div>

        <div className='batch-summary-card__item batch-summary-card__item--green'>
          <div className='batch-summary-card__label'>Best Accuracy</div>
          <div className='batch-summary-card__value'>
            {summary.best_final_accuracy?.toFixed(2)}%
          </div>
          <div className='batch-summary-card__subtitle'>
            {summary.best_performing_test}
          </div>
        </div>

        <div className='batch-summary-card__item batch-summary-card__item--purple'>
          <div className='batch-summary-card__label'>Avg Throughput</div>
          <div className='batch-summary-card__value'>
            {summary.avg_throughput?.toFixed(0)} ops/s
          </div>
        </div>

        <div className='batch-summary-card__item batch-summary-card__item--orange'>
          <div className='batch-summary-card__label'>Best Loss</div>
          <div className='batch-summary-card__value'>
            {summary.best_final_loss?.toFixed(4)}
          </div>
        </div>

        <div className='batch-summary-card__item batch-summary-card__item--red'>
          <div className='batch-summary-card__label'>Worst Accuracy</div>
          <div className='batch-summary-card__value'>
            {summary.worst_final_accuracy?.toFixed(2)}%
          </div>
          <div className='batch-summary-card__subtitle'>
            {summary.worst_performing_test}
          </div>
        </div>

        <div className='batch-summary-card__item batch-summary-card__item--gray'>
          <div className='batch-summary-card__label'>Avg Accuracy</div>
          <div className='batch-summary-card__value'>
            {summary.avg_final_accuracy?.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
}
