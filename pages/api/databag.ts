// this api takes in a text string and sends a post to an api and returns success or failure
// to the client

const endpoint =
  "https://chat.rboskind.com/content/channels/58ba9c55-1f47-4a21-b69f-56ec22d5975d/topics?agent=20e6d3dcd3807153b92b70732bf958b9c92b1a07b0e7bccf9494244db67c64ef.3a69fc04963dee1b50dfe52714be949b&confirm=true";

import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let { text } = req.body;
  console.log("text", text);

  //   the body of the post request should look like {"data":"{\"text\":\"text message here\"}","datatype":"superbasictopic"}

  const body = JSON.stringify({
    data: JSON.stringify({ text: text }),
    datatype: "superbasictopic",
  });
  const data = await fetch(endpoint, {
    method: "POST",
    body: body,
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => res.json());

  if (data) {
    res.status(200).json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
}
