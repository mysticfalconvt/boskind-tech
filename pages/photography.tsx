import PhotoCarousel from "@/components/PhotoCarousel";
import { copy } from "@/lib/copy";
import { photoAlbums } from "@/lib/photoList";
import React from "react";

export default function page() {
  const [albumName, setAlbumName] = React.useState("panorama");
  const [photoList, setPhotoList] = React.useState(photoAlbums[albumName]);
  const listOfAlbums = Object.keys(photoAlbums);

  // whenever the album name changes, remove the #slide from the url and update to #slide0
  React.useEffect(() => {
    window.location.hash = "#slide0";
  }, [albumName]);
  return (
    <div className="flex flex-col items-center justify-center text-base-content">
      <h1 className="text-5xl m-5">{copy.components.photography.title}</h1>
      <div className=" prose ">
        {copy.components.photography.existingWork}
        <a className="link link-primary-content" href="https://nekpics.com">
          {copy.components.photography.NekPics}
        </a>
      </div>
      <div className="flex flex-row gap-4 mt-2">
        {listOfAlbums.map((albumName) => (
          <button
            key={albumName}
            className="btn btn-primary text-primary-content shadow-sm shadow-primary-focus hover:shadow-md hover:shadow-primary"
            onClick={() => {
              setAlbumName(albumName);
              setPhotoList(photoAlbums[albumName]);
            }}
          >
            {albumName}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <PhotoCarousel photoList={photoList} />
      </div>
    </div>
  );
}
