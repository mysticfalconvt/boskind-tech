import { Photo } from '@/lib/photoList';
import Image from 'next/image';
import { useState } from 'react';

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

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % photoList.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + photoList.length) % photoList.length);
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
        <div className="relative w-full h-[600px]">
          <Image
            src={photoList[currentIndex].url}
            alt={
              photoList[currentIndex].description ||
              photoList[currentIndex].title
            }
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            className="object-contain"
            priority
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-between p-4">
          <button
            onClick={prevImage}
            className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
          >
            ←
          </button>
          <button
            onClick={nextImage}
            className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
          >
            →
          </button>
        </div>
        <div className="mt-2 text-center">
          <p className="text-lg font-semibold">
            {formatDate(photoList[currentIndex].title)}
          </p>
          <p className="text-sm text-gray-500">
            {currentIndex + 1} of {photoList.length}
          </p>
        </div>
      </div>

      {/* Thumbnail strip */}
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
    </div>
  );
}
