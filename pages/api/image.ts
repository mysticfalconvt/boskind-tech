// this needs to take in a query param of the image url
// and return the image from the url so that the url can use the x-api-key
// to get the image

import { NextApiRequest, NextApiResponse } from 'next';
import sharp from 'sharp';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { photoId, isThumb = false, fullRes = false } = req.query;

  const baseImmichUrl = process.env.IMMICH_URL || '';

  // Use different endpoints based on whether we want a thumbnail or full-size image
  const apiUrl =
    isThumb === 'true'
      ? `${baseImmichUrl}/api/assets/${photoId}/thumbnail`
      : `${baseImmichUrl}/api/assets/${photoId}/original`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'x-api-key': process.env.IMMICH_API_KEY as string,
        Accept: 'image/jpeg',
      },
    });

    if (response.ok) {
      // Get the image content
      const imageBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(imageBuffer);

      // Process the image with Sharp only if not full resolution
      let processedBuffer: Buffer = buffer;
      if (isThumb !== 'true' && fullRes !== 'true') {
        processedBuffer = await sharp(buffer)
          .resize(1920, 1080, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({
            quality: 80,
            mozjpeg: true,
          })
          .toBuffer();
      }

      // Set response headers
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'max-age=31536000, immutable');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(processedBuffer);
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
