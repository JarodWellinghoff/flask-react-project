// src/components/ProgressBar/ProgressBar.jsx
import React from "react";
import { DataTransformService } from "../../services/dataTransform";
import "./ProgressBar.css";

export function ProgressBar({
  progress,
  elapsedTime,
  messageCount,
  dataTransferred,
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className='progress-bar'>
      <div className='progress-bar__track'>
        <div className='progress-bar__fill' style={{ width: `${progress}%` }}>
          <span className='progress-bar__text'>{progress}%</span>
        </div>
      </div>

      <div className='progress-bar__stats'>
        <div className='stat'>
          <span className='stat__label'>Elapsed:</span>
          <span className='stat__value'>{formatTime(elapsedTime)}</span>
        </div>
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
      </div>
    </div>
  );
}
