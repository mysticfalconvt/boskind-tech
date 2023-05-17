import { render, screen } from "@testing-library/react";
import TextTyper from "../TextTyper";

describe("TextTyper", () => {
  it("displays the text with typing animation", async () => {
    const text = "Hello";
    render(<TextTyper text={text} />);

    const typedText = await screen.findByText(text);
    expect(typedText).toBeTruthy();
  });
});
