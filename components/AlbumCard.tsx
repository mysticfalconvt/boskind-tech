import Image from 'next/image';
import { useEffect, useState } from 'react';

type AlbumCardProps = {
  album: {
    id: string;
    title: string;
    description?: string;
    coverImage?: string;
    photoUrls: string[];
  };
  delay: number; // Delay in seconds before starting the slideshow
  numberOfAlbums: number; // Total number of albums being displayed
};

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const AlbumCard = ({ album, delay, numberOfAlbums }: AlbumCardProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [shuffledPhotos] = useState(() => shuffleArray(album.photoUrls));

  useEffect(() => {
    if (shuffledPhotos.length <= 1) return;

    // Calculate the initial delay based on the card's position (in seconds)
    const initialDelay = delay * 1000;

    // Set up the interval with the initial delay
    const timeoutId = setTimeout(() => {
      // Start the interval after the initial delay
      const intervalId = setInterval(() => {
        setCurrentPhotoIndex((prev) => (prev + 1) % shuffledPhotos.length);
      }, numberOfAlbums * 1000); // Cycle every N seconds where N is the number of albums

      // Clean up the interval
      return () => clearInterval(intervalId);
    }, initialDelay);

    // Clean up the timeout
    return () => clearTimeout(timeoutId);
  }, [shuffledPhotos.length, delay, numberOfAlbums]);

  return (
    <a href={`/photography/${album.id}`} className="group">
      <div className="bg-gradient-to-tr from-primary/40 via-secondary/30 to-accent/40 dark:from-primary/30 dark:via-secondary/50 dark:to-accent/30 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 transform hover:scale-105 relative group flex flex-col">
        <div className="relative aspect-[4/3] w-full">
          <div className="absolute inset-3 rounded-2xl">
            {shuffledPhotos.length > 0 ? (
              <Image
                src={shuffledPhotos[currentPhotoIndex]}
                alt={`Preview for ${album.title}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain bg-transparent transition-transform duration-500"
                priority={currentPhotoIndex === 0}
              />
            ) : (
              <div className="w-full h-full bg-base-300 flex items-center justify-center">
                <span className="text-base-content/50">
                  No preview available
                </span>
              </div>
            )}
            {/* Gradient overlay for text readability */}
            {/* <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none rounded-t-2xl" /> */}
          </div>
        </div>
        <div className="p-6 bg-transparent rounded-b-2xl flex-1 flex flex-col justify-end">
          <h2 className="text-2xl font-serif font-bold mb-2 group-hover:text-primary transition-colors">
            {album.title}
          </h2>
          {album.description && (
            <p className="text-base-content/80 text-sm">{album.description}</p>
          )}
        </div>
      </div>
    </a>
  );
};

export default AlbumCard;
