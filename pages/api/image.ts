// this needs to take in a query param of the image url
// and return the image from the url so that the url can use the x-api-key
// to get the image

import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { photoId, isWeb = true } = req.query;
  const apiUrl = `https://pics.rboskind.com/api/asset/file/${photoId}${
    isWeb ? "/?isWeb=true" : ""
  }`;
  const response = await fetch(apiUrl, {
    headers: {
      "x-api-key": process.env.IMMICH_API_KEY as string,
      type: "image/jpeg",
    },
  });
  if (response.ok) {
    // Get the image content and set it as the response
    const imageBuffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "max-age=31536000, immutable");
    res.setHeader("Access-Control-Allow-Origin", "*");
    const buffer = Buffer.from(imageBuffer);
    res.end(buffer);
  } else {
    // Handle non-successful responses
    const errorMessage = await response.text();
    res.status(response.status).json({ error: errorMessage });
  }
};
