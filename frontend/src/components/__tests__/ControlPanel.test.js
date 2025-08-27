// frontend/src/components/__tests__/ControlPanel.test.js
import { render, screen, fireEvent } from "@testing-library/react";
import { ControlPanel } from "../ControlPanel/ControlPanel";

describe("ControlPanel", () => {
  const mockProps = {
    onStart: jest.fn(),
    onCancel: jest.fn(),
    onDownload: jest.fn(),
    isRunning: false,
    taskId: null,
  };

  test("renders input and start button", () => {
    render(<ControlPanel {...mockProps} />);

    expect(screen.getByLabelText(/iterations/i)).toBeInTheDocument();
    expect(screen.getByText(/start calculation/i)).toBeInTheDocument();
  });

  test("disables input when running", () => {
    render(<ControlPanel {...mockProps} isRunning={true} />);

    expect(screen.getByLabelText(/iterations/i)).toBeDisabled();
  });

  test("shows cancel button when running", () => {
    render(<ControlPanel {...mockProps} isRunning={true} />);

    expect(screen.getByText(/cancel/i)).toBeInTheDocument();
  });

  test("calls onStart with correct parameters", () => {
    render(<ControlPanel {...mockProps} />);

    const button = screen.getByText(/start calculation/i);
    fireEvent.click(button);

    expect(mockProps.onStart).toHaveBeenCalledWith(30, { seed: 42 });
  });
});
