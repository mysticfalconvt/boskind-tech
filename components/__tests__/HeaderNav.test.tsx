import { render, screen, fireEvent } from "@testing-library/react";
import { HeaderNav } from "../HeaderNav";
import "@testing-library/jest-dom/extend-expect"; // import the matcher
import "@testing-library/jest-dom";

describe("HeaderNav", () => {
  it("renders the title link", () => {
    render(
      <HeaderNav
        theme="light"
        toggleTheme={() => {}}
        menuStatus={false}
        toggleMenu={() => {}}
      />
    );
    const titleLink = screen.getByText("Boskind Digital");
    expect(titleLink).toBeInTheDocument();
    expect(titleLink).toHaveAttribute("href", "/");
  });
});
