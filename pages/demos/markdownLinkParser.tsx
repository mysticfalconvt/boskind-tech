import React from "react";

export default function markdownLinks() {
  const [inputText, setInputText] = React.useState(
    "this is a test with a [link](https://google.com) here is [a second link](https://maps.google.com) and now I will have 2 links next to each other like [this](https://stardog.com)[and that](https://boskind.tech)"
  );

  const parseMarkdownLinks = (markdownText: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    const parts = markdownText.split(linkRegex);
    const jsxElements = parts.map((part, index) => {
      if (index % 3 === 0) {
        return <React.Fragment key={index}>{part}</React.Fragment>;
      } else if (index % 3 === 1) {
        return (
          <a className="link" key={index} href={parts[index + 1]}>
            {part}
          </a>
        );
      } else {
        return null;
      }
    });

    return <>{jsxElements}</>;
  };

  return (
    <div className="flex flex-col sm:p-10 items-center justify-center text-base-content">
      <h1 className="text-4xl  m-10">Markdown formatted link parser</h1>

      <input
        type="text"
        className="input input-bordered input-primary m-4 w-full"
        onChange={(e) => setInputText(e.target.value || "")}
        value={inputText}
      />

      <p className="text-2xl  m-10">{parseMarkdownLinks(inputText)}</p>
    </div>
  );
}
