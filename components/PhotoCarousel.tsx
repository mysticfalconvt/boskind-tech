import React from "react";
import { Photo } from "@/lib/photoList";
import ImageGallery, { ReactImageGalleryItem } from "react-image-gallery";
// import stylesheet if you're not already using CSS @import
import "react-image-gallery/styles/css/image-gallery.css";

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
    thumbnail: photo.url,
    originalAlt: photo.description,
    // description: photo.description,
    originalTitle: photo.description,
  }));

  return <ImageGallery items={images} thumbnailPosition="top" />;
}
