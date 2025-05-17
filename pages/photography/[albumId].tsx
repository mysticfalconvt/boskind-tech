import PhotoCarousel from '@/components/PhotoCarousel';
import { copy } from '@/lib/copy';
import { Photo } from '@/lib/photoList';
import { GetStaticPropsContext } from 'next';
const defaultAlbumId = '78dc32d2-7155-44fb-99bf-5b75bc5d43d0';
const xApiKey = process.env.IMMICH_API_KEY || '';

const getAlbumInfo = async (albumId: string): Promise<any> => {
  const baseImmichUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://10.0.0.50:2283'
      : 'https://pics.rboskind.com';
  const queryAlbumId = albumId && albumId !== '1' ? albumId : defaultAlbumId;
  const apiUrl = `${baseImmichUrl}/api/albums/${queryAlbumId}`;
  let resData = null;
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-api-key': xApiKey,
        contentType: 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    resData = await response.json();
  } catch (error) {
    console.error('Error fetching album info:', error);
    // Return a default empty album structure
    return {
      assets: [],
      albumName: 'Error loading album',
    };
  }
  console.log('resData', resData);
  return resData;
};

const getAlbumList = async (): Promise<any> => {
  const baseImmichUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://10.0.0.50:2283'
      : 'https://pics.rboskind.com';
  const apiUrl = `${baseImmichUrl}/api/albums`;
  let resData = [];
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-api-key': xApiKey,
        contentType: 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    resData = await response.json();
  } catch (error) {
    console.error('Error fetching album list:', error);
    return [];
  }
  return resData;
};

export const getStaticProps = async (context: GetStaticPropsContext) => {
  try {
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
      doesAlbumExist ? albumId : defaultAlbumId,
    );
    const photos = albumInfo?.assets?.map((photo: any) => photo.id) || [];
    const path = `${
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://boskind.tech'
    }/api/image`;
    const photoList: Photo[] = photos.map((photo: any) => {
      return {
        url: `${path}/?photoId=${photo}&isWeb=true`,
        thumbnailUrl: `${path}/?photoId=${photo}&isWeb=false&isThumb=true`,
        title: photo.fileCreatedAt || 'No date',
        description:
          photo.description ||
          photo.fileCreatedAt ||
          'No description available',
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
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return {
      props: {
        albumInfo: { assets: [], albumName: 'Error loading album' },
        photos: [],
        albumNamesById: {},
        albumId: defaultAlbumId,
      },
    };
  }
};

export const getStaticPaths = async () => {
  const albumList = await getAlbumList();
  console.log('albumListPaths');
  let albumNamesById: Record<string, string> = {};
  albumList?.forEach((album: any) => {
    if (album.shared === true) {
      albumNamesById[album.id] = album.albumName;
    }
  });

  const paths = Object.keys(albumNamesById).map((albumId) => ({
    params: { albumId },
  }));
  console.log('paths', paths);
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
  console.log('photos', photos);
  const albumName = albumNamesById[albumId] || 'default';
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
