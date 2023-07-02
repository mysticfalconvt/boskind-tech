import React from "react";
import Image from "next/image";
import { Photo, panoramaList } from "@/lib/photoList";

type PhotoCarouselProps = {
  photoList: Photo[];
};

export default function PhotoCarousel({ photoList }: PhotoCarouselProps) {
  return (
    <div className="carousel w-full">
      {photoList.map((photo, index) => {
        const previousIndex = index === 0 ? panoramaList.length - 1 : index - 1;
        const nextIndex = index === panoramaList.length - 1 ? 0 : index + 1;
        return (
          <div
            id={`slide${index}`}
            className="carousel-item relative overflow-visible w-full"
            key={`slide${index}`}
          >
            <Image
              src={photo.url}
              alt={photo.description}
              className="w-full object-contain "
              width={0}
              height={0}
              priority
              sizes="100vw"
            />
            <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
              <a href={`#slide${previousIndex}`} className="btn btn-circle">
                ❮
              </a>
              <a href={`#slide${nextIndex}`} className="btn btn-circle">
                ❯
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
