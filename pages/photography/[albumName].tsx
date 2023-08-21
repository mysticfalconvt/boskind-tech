import React, { use } from "react";
import { photoAlbums } from "@/lib/photoList";
import PhotoCarousel from "@/components/PhotoCarousel";
import { copy } from "@/lib/copy";
import { getPhotosFromAlbum } from "@/lib/getPhotos";

const listOfAlbums = Object.keys(photoAlbums);

export default function albumPage({ albumName }: { albumName: string }) {
  const [photoList, setPhotoList] = React.useState();

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
          <a key={albumName} href={`/photography/${albumName}`}>
            <button className="btn btn-primary text-primary-content shadow-sm shadow-primary-focus hover:shadow-md hover:shadow-primary">
              {albumName}
            </button>
          </a>
        ))}
      </div>
      <div className="mt-4" key={albumName}>
        <PhotoCarousel
          photoList={photoAlbums[albumName]}
          albumName={albumName}
          key={albumName}
        />
      </div>
    </div>
  );
}

export async function getStaticProps({
  params,
}: {
  params: { albumName: string };
}) {
  const albumName = params.albumName;
  const photos = await getPhotosFromAlbum("");
  // console.log("photos", photos);
  return { props: { albumName } };
}

export async function getStaticPaths() {
  const albums = photoAlbums;
  const paths = Object.keys(albums).map((albumName) => ({
    params: { albumName },
  }));
  // console.log(paths);
  return { paths, fallback: false };
}
