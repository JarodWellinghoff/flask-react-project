// frontend/src/App.test.js
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders main title", () => {
  render(<App />);
  const titleElement = screen.getByText(/Real-time Calculation Dashboard/i);
  expect(titleElement).toBeInTheDocument();
});
