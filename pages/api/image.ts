// this needs to take in a query param of the image url
// and return the image from the url so that the url can use the x-api-key
// to get the image

import { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { photoId, isThumb = false } = req.query;

  const baseImmichUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://10.0.0.50:2283'
      : 'https://pics.rboskind.com';

  // Use different endpoints based on whether we want a thumbnail or full-size image
  const apiUrl =
    isThumb === 'true'
      ? `${baseImmichUrl}/api/assets/${photoId}/thumbnail?=fullsize`
      : `${baseImmichUrl}/api/assets/${photoId}/original`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'x-api-key': process.env.IMMICH_API_KEY as string,
        type: 'image/jpeg',
      },
    });

    if (response.ok) {
      // Get the image content and set it as the response
      const imageBuffer = await response.arrayBuffer();
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'max-age=31536000, immutable');
      res.setHeader('Access-Control-Allow-Origin', '*');
      const buffer = Buffer.from(imageBuffer);
      res.end(buffer);
    } else {
      // Handle non-successful responses
      const errorMessage = await response.text();
      console.error('Error fetching image:', errorMessage);
      res.status(response.status).json({ error: errorMessage });
    }
  } catch (error) {
    console.error('Error in image API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
