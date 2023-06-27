import CassidooFooter from "@/components/CassidooFooter";
import React from "react";

export default function jsonDepth() {
  const [json, setJson] = React.useState(
    `   {
        "name": "Cassidoo",
        "favoriteFood": "taco bell",
        "favoriteThingToDo": "Rendezvous",
        "programmingLanguages": [
          "javascript",
          "baby talk"
        ]
      }
      ` as any
  );
  const [depth, setDepth] = React.useState(0);
  const [error, setError] = React.useState("");

  const checkIfValid = (json: any) => {
    try {
      JSON.parse(json);
    } catch (e) {
      setError("Invalid JSON");
      return false;
    }
    setError("");
    return true;
  };

  const checkDepth = (json: any) => {
    const parsedJson = JSON.parse(json);
    let maxDepth = 0;

    const getDepthRecursive = (data: any, depth: number) => {
      if (depth > maxDepth) {
        maxDepth = depth;
      }
      if (typeof data === "object") {
        if (Array.isArray(data)) {
          for (const element of data) {
            getDepthRecursive(element, depth);
          }
        } else {
          for (const key in data) {
            if (data.hasOwnProperty(key)) {
              getDepthRecursive(data[key], depth + 1);
            }
          }
        }
      }
    };

    getDepthRecursive(parsedJson, 1);

    setDepth(maxDepth);
  };

  return (
    <div className="flex flex-col items-center justify-center text-base-content">
      <h1 className="text-4xl text-base-content m-10">JSON Depth</h1>
      <h2 className="text-2xl text-base-content m-10">
        This is a simple algorithm to calculate the depth of a JSON object
      </h2>
      <p>Enter a JSON object below and the depth will be calculated</p>
      <textarea
        className="textarea textarea-bordered textarea-primary w-full sm:w-3/4 m-4 h-96"
        placeholder="Enter JSON here"
        onChange={(e) => setJson(e.target.value)}
        value={json}
      />
      <button
        className="btn btn-primary m-4"
        onClick={() => {
          const isValid = checkIfValid(json);
          if (isValid) {
            checkDepth(json);
          }
        }}
      >
        Calculate Depth
      </button>
      {error ? (
        <p>{error}</p>
      ) : (
        <p>
          Depth: <span id="depth">{depth}</span>
        </p>
      )}
      <CassidooFooter
        newsletterLink="https://buttondown.email/cassidoo/archive/5640/"
        githubLink="https://github.com/mysticfalconvt/boskind-tech/blob/main/pages/demos/jsonDepth.tsx"
      />
    </div>
  );
}
