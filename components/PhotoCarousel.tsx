import { Photo } from '@/lib/photoList';
import Image from 'next/image';
import { useState } from 'react';

type PhotoCarouselProps = {
  photoList: Photo[];
  albumName: string;
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
            {photoList[currentIndex].title}
          </p>
          {photoList[currentIndex].description && (
            <p className="text-sm text-gray-600">
              {photoList[currentIndex].description}
            </p>
          )}
          <p className="text-sm text-gray-500">
            {currentIndex + 1} of {photoList.length}
          </p>
        </div>
      </div>
    </div>
  );
}
