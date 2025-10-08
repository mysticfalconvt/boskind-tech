import { Photo } from '@/lib/photoList';
import Image from 'next/image';
import { useEffect, useState } from 'react';

type PhotoCarouselProps = {
  photoList: Photo[];
  albumName: string;
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'No date';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return dateString;
  }
};

export default function PhotoCarousel({
  photoList,
  albumName,
}: PhotoCarouselProps): JSX.Element {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen]);

  useEffect(() => {
    let slideshowInterval: NodeJS.Timeout;

    if (isFullscreen && isPlaying) {
      slideshowInterval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % photoList.length);
      }, 5000);
    }

    return () => {
      if (slideshowInterval) {
        clearInterval(slideshowInterval);
      }
    };
  }, [isFullscreen, isPlaying, photoList.length]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      setIsPlaying(true);
    }
  };

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % photoList.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + photoList.length) % photoList.length);
  };

  const handleDownload = async () => {
    const photo = photoList[currentIndex];
    const fullResUrl = `/api/image?photoId=${
      photo.url.split('photoId=')[1].split('&')[0]
    }&fullRes=true`;

    try {
      const response = await fetch(fullResUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo-${photo.title || currentIndex}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  if (!photoList.length) {
    return (
      <div className="w-10/12 text-center">
        <h3 className="text-3xl font-bold">No images available</h3>
      </div>
    );
  }

  return (
    <div className="w-10/12">
      {albumName && albumName !== 'default' ? (
        <h3 className="text-center text-3xl font-bold mb-4">{albumName}</h3>
      ) : null}
      <div className="relative">
        {isFullscreen ? (
          <div
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
            onClick={toggleFullscreen}
          >
            <div className="relative w-full h-full">
              <Image
                src={photoList[currentIndex].url}
                alt={
                  photoList[currentIndex].description ||
                  photoList[currentIndex].title
                }
                fill
                sizes="100vw"
                className="object-contain cursor-zoom-out"
                priority
              />
              <button
                onClick={togglePlayPause}
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 pointer-events-auto z-10"
                title={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
              >
                {isPlaying ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </button>
              <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
                {!isPlaying && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                      }}
                      className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 pointer-events-auto"
                    >
                      ←
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                      className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 pointer-events-auto"
                    >
                      →
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="relative w-full h-[600px]">
              <Image
                src={photoList[currentIndex].url}
                alt={
                  photoList[currentIndex].description ||
                  photoList[currentIndex].title
                }
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                className="object-contain cursor-zoom-in"
                priority
                onClick={toggleFullscreen}
              />
              <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 pointer-events-auto"
                >
                  ←
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 pointer-events-auto"
                >
                  →
                </button>
              </div>
            </div>
            {/* Image info and download button */}
            <div className="mt-2 text-center relative z-10">
              <p className="text-sm text-gray-500">
                {currentIndex + 1} of {photoList.length}
              </p>
              <button
                type="button"
                onClick={handleDownload}
                className="mt-2 px-4 py-2 bg-primary text-primary-content rounded-lg hover:bg-primary-focus transition-colors cursor-pointer select-text"
              >
                Download Full Resolution
              </button>
            </div>
          </>
        )}

        {/* Thumbnail strip */}
        {!isFullscreen && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {photoList.map((photo, index) => (
              <div
                key={photo.url}
                className={`relative h-20 w-20 flex-shrink-0 cursor-pointer transition-opacity ${
                  index === currentIndex
                    ? 'ring-2 ring-primary'
                    : 'opacity-70 hover:opacity-100'
                }`}
                onClick={() => setCurrentIndex(index)}
              >
                <Image
                  src={photo.thumbnailUrl || photo.url}
                  alt={photo.description || photo.title}
                  fill
                  sizes="80px"
                  priority={index === 0}
                  className="object-cover rounded"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
