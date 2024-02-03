import PhotoCarousel from "@/components/PhotoCarousel";
import { copy } from "@/lib/copy";
import { Photo, photoAlbums } from "@/lib/photoList";
import React, { use } from "react";
const albumId = "78dc32d2-7155-44fb-99bf-5b75bc5d43d0";
const xApiKey = process.env.IMMICH_API_KEY || "";

const getAlbumInfo = async (albumId: string): Promise<any> => {
  const apiUrl = `https://pics.rboskind.com/api/album/${albumId}`;
  let resData = [""];
  await fetch(apiUrl, {
    method: "GET",
    headers: {
      "x-api-key": xApiKey,
      contentType: "application/json",
    },
  })
    .then(async (response) => {
      resData = await response.json();
    })
    .catch((error) => {
      console.error("Error:", error);
    });

  return resData;
};

export const getServerSideProps = async () => {
  const albumInfo = await getAlbumInfo(albumId);
  const photos = albumInfo.assets.map((photo: any) => photo.id);
  const path = "https://boskind.tech/api/image";
  const photoList: Photo[] = photos.map((photo: any) => {
    return {
      url: `${path}/?photoId=${photo}&isWeb=true`,
      // description: "test",
      title: photo.fileCreatedAt,
    };
  });
  return {
    props: {
      albumInfo,
      photos: photoList,
    },
  };
};

export default function page({
  albumInfo,
  photos,
}: {
  albumInfo: any;
  photos: Photo[];
}) {
  const [albumName, setAlbumName] = React.useState("panorama");
  // const [photoList, setPhotoList] = React.useState(photoAlbums[albumName]);
  const listOfAlbums = Object.keys(photoAlbums);

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
        {/* {listOfAlbums.map((albumName) => (
          <a key={albumName} href={`/photography/${albumName}`}>
            <button className="btn btn-primary text-primary-content shadow-sm shadow-primary-focus hover:shadow-md hover:shadow-primary">
              {albumName}
            </button>
          </a>
        ))} */}
      </div>
      <div className="mt-4" key={albumName}>
        <PhotoCarousel
          photoList={photos}
          albumName={albumName}
          key={albumName}
        />
      </div>
    </div>
  );
}
