// frontend/src/components/__tests__/ProgressBar.test.js
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "../ProgressBar/ProgressBar";

describe("ProgressBar", () => {
  test("displays progress percentage", () => {
    render(
      <ProgressBar
        progress={50}
        elapsedTime={30}
        messageCount={10}
        dataTransferred={1024}
      />
    );

    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  test("formats elapsed time correctly", () => {
    render(
      <ProgressBar
        progress={50}
        elapsedTime={125} // 2:05
        messageCount={10}
        dataTransferred={1024}
      />
    );

    expect(screen.getByText("2:05")).toBeInTheDocument();
  });
});
