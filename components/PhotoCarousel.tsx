import React from "react";
import Image from "next/image";
import { Photo, panoramaList } from "@/lib/photoList";

type PhotoCarouselProps = {
  photoList: Photo[];
};

export default function PhotoCarousel({ photoList }: PhotoCarouselProps) {
  return (
    <div className="carousel w-full">
      {photoList.map((panorama, index) => {
        const previousIndex = index === 0 ? panoramaList.length - 1 : index - 1;
        const nextIndex = index === panoramaList.length - 1 ? 0 : index + 1;
        console.log(index, previousIndex, nextIndex, panorama.url);
        return (
          <div
            id={`slide${index}`}
            className="carousel-item relative overflow-visible w-full"
            key={`slide${index}`}
          >
            <div
              className="tooltip tooltip-open tooltip-top"
              data-tip="Panorama"
            >
              <Image
                src={panorama.url}
                alt={panorama.description}
                className="w-full"
                width={3840}
                height={2160}
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
          </div>
        );
      })}
    </div>
  );
}
