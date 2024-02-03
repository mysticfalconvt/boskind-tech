import PhotoCarousel from "@/components/PhotoCarousel";
import { copy } from "@/lib/copy";
import { Photo } from "@/lib/photoList";
import { GetStaticPropsContext } from "next";
import React from "react";
const defaultAlbumId = "78dc32d2-7155-44fb-99bf-5b75bc5d43d0";
const xApiKey = process.env.IMMICH_API_KEY || "";

const getAlbumInfo = async (albumId: string): Promise<any> => {
  const baseImmichUrl =
    process.env.NODE_ENV === "development"
      ? "http://10.0.0.166:2283"
      : "https://pics.boskind.tech";
  const queryAlbumId = albumId && albumId !== "1" ? albumId : defaultAlbumId;
  const apiUrl = `${baseImmichUrl}/api/album/${queryAlbumId}`;
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

const getAlbumList = async (): Promise<any> => {
  const baseImmichUrl =
    process.env.NODE_ENV === "development"
      ? "http://10.0.0.166:2283"
      : "https://pics.boskind.tech";
  const apiUrl = `${baseImmichUrl}/api/album`;
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

export const getStaticProps = async (context: GetStaticPropsContext) => {
  // get album id from url
  const albumId = (context.params?.albumId as string) || defaultAlbumId;
  const albumList = await getAlbumList();
  let albumNamesById: Record<string, string> = {};
  albumList.forEach((album: any) => {
    if (album.shared === true) {
      albumNamesById[album.id] = album.albumName;
    }
  });
  const doesAlbumExist = albumId && albumNamesById[albumId];
  const albumInfo = await getAlbumInfo(
    doesAlbumExist ? albumId : defaultAlbumId
  );
  const photos = albumInfo?.assets?.map((photo: any) => photo.id);
  const path = `${
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://boskind.tech"
  }/api/image`;
  const photoList: Photo[] = photos.map((photo: any) => {
    return {
      url: `${path}/?photoId=${photo}&isWeb=true`,
      thumbnailUrl: `${path}/?photoId=${photo}&isWeb=false&isThumb=true`,
      title: photo.fileCreatedAt || "No date",
    };
  });
  return {
    props: {
      albumInfo,
      photos: photoList,
      albumNamesById,
      albumId: albumId || defaultAlbumId,
    },
  };
};

export const getStaticPaths = async () => {
  const albumList = await getAlbumList();
  let albumNamesById: Record<string, string> = {};
  albumList.forEach((album: any) => {
    if (album.shared === true) {
      albumNamesById[album.id] = album.albumName;
    }
  });
  albumNamesById[1] = "default";
  const paths = Object.keys(albumNamesById).map((albumId) => ({
    params: { albumId },
  }));
  return { paths, fallback: false };
};

export default function page({
  albumInfo,
  albumNamesById,
  photos,
  albumId,
}: {
  albumInfo: any;
  photos: Photo[];
  albumNamesById: Record<string, string>;
  albumId: string;
}) {
  const listOfAlbums = Object.entries(albumNamesById).map((entry) => {
    return { title: entry[1], id: entry[0] };
  });

  const albumName = albumNamesById[albumId] || "default";
  return (
    <div className="flex flex-col w-full items-center justify-center text-base-content">
      <h1 className="text-5xl m-5">{copy.components.photography.title}</h1>
      <div className=" prose "></div>
      <div className="flex flex-row gap-4 mt-2">
        {listOfAlbums.map((album) => (
          <a key={album.id} href={`/photography/${album.id}`}>
            <button className="btn btn-primary text-primary-content shadow-sm shadow-primary-focus hover:shadow-md hover:shadow-primary">
              {album.title}
            </button>
          </a>
        ))}
      </div>
      <div
        className="mt-4 w-full flex items-center justify-center"
        key={albumName}
      >
        <PhotoCarousel
          photoList={photos}
          albumName={albumName}
          key={albumName}
        />
      </div>
    </div>
  );
}
