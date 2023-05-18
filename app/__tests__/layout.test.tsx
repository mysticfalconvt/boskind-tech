import { render, screen, fireEvent } from "@testing-library/react";
import RootLayout from "../layout";
import "@testing-library/jest-dom";

describe("RootLayout", () => {
  it("renders the children", () => {
    render(
      <RootLayout>
        <div>Test child</div>
      </RootLayout>
    );
    const childElement = screen.getByText("Test child");
    expect(childElement).toBeInTheDocument();
  });

  it.only("toggles the theme when the theme switch is clicked", () => {
    //    check that data-theme is set to winter on html

    render(
      <RootLayout>
        <div>Test child</div>
      </RootLayout>
    );
    // const themeSwitch = screen.getByTestId("theme-toggle");
    // fireEvent.click(themeSwitch);
    // expect(setThemeMock).toHaveBeenCalledWith("dark");
  });
});
