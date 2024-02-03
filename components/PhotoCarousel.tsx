import React from "react";
import { Photo } from "@/lib/photoList";
import ImageGallery, { ReactImageGalleryItem } from "react-image-gallery";
// import stylesheet if you're not already using CSS @import
import "react-image-gallery/styles/css/image-gallery.css";
import Image from "next/image";

type PhotoCarouselProps = {
  photoList: Photo[];
  albumName: string;
};

export default function PhotoCarousel({
  photoList,
  albumName,
}: PhotoCarouselProps): JSX.Element {
  const images: ReactImageGalleryItem[] = photoList.map((photo) => ({
    original: photo.url,
    thumbnail: photo.thumbnailUrl || photo.url,
    originalAlt: photo.description || photo.title,
    // description: photo.description,
    originalTitle: photo.description,
  }));

  const renderItem = (item: ReactImageGalleryItem) => {
    return (
      <div className="image-gallery-image">
        <Image
          src={item.original}
          sizes={item.sizes}
          title={item.originalTitle}
          alt={item.originalAlt || "no description"}
        />
        {item.description ? (
          <span className="image-gallery-description">{item.description}</span>
        ) : null}
      </div>
    );
  };

  return (
    <div className="w-10/12">
      {albumName && albumName !== "default" ? (
        <h3 className="text-center text-3xl font-bold">{albumName}</h3>
      ) : null}
      <ImageGallery
        items={images}
        thumbnailPosition="top"
        // renderItem={renderItem}
      />
    </div>
  );
}
