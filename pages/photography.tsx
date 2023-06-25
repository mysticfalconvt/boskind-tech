import PhotoCarousel from "@/components/PhotoCarousel";
import { copy } from "@/lib/copy";
import { panoramaList } from "@/lib/photoList";
import React from "react";

export default function page() {
  const [photoList, setPhotoList] = React.useState(panoramaList);

  return (
    <div className="flex flex-col items-center justify-center text-base-content">
      <h1 className="text-5xl m-5">{copy.components.photography.title}</h1>
      <div className=" prose ">
        {copy.components.photography.existingWork}
        <a className="link link-primary-content" href="https://nekpics.com">
          {copy.components.photography.NekPics}
        </a>
      </div>
      <div className="mt-4">
        <PhotoCarousel photoList={photoList} />
      </div>
    </div>
  );
}
