import AlbumCard from '@/components/AlbumCard';
import { copy } from '@/lib/copy';
import { GetStaticProps } from 'next';

type Album = {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  photoUrls: string[];
};

type PhotographyPageProps = {
  albums: Album[];
};

const getAlbumInfo = async (albumId: string): Promise<any> => {
  const baseImmichUrl = process.env.IMMICH_URL || '';
  const xApiKey = process.env.IMMICH_API_KEY || '';
  const apiUrl = `${baseImmichUrl}/api/albums/${albumId}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-api-key': xApiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching album info:', error);
    return null;
  }
};

const getAlbumList = async (): Promise<Album[]> => {
  const baseImmichUrl = process.env.IMMICH_URL || '';
  const xApiKey = process.env.IMMICH_API_KEY || '';
  const apiUrl = `${baseImmichUrl}/api/albums`;
  const basePath =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://boskind.tech';

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-api-key': xApiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const albums = await response.json();
    const filteredAlbums = albums.filter(
      (album: any) => album.shared === true && album.albumName.includes('**'),
    );

    // Fetch details for each album
    const albumsWithPhotos = await Promise.all(
      filteredAlbums.map(async (album: any) => {
        const albumInfo = await getAlbumInfo(album.id);
        const photoUrls =
          albumInfo?.assets?.map(
            (asset: any) =>
              `${basePath}/api/image?photoId=${asset.id}&isThumb=true`,
          ) || [];

        return {
          id: album.id,
          title: album.albumName.replace(/\*\*/g, ''),
          description: album.description || '',
          coverImage: album.coverImage || '',
          photoUrls,
        };
      }),
    );

    return albumsWithPhotos;
  } catch (error) {
    console.error('Error fetching album list:', error);
    return [];
  }
};

export const getStaticProps: GetStaticProps<
  PhotographyPageProps
> = async () => {
  const albums = await getAlbumList();

  return {
    props: {
      albums,
    },
    revalidate: 3600, // Revalidate every hour
  };
};

export default function PhotographyPage({ albums }: PhotographyPageProps) {
  return (
    <div className="flex flex-col w-full items-center justify-center text-base-content px-4 py-8">
      <h1 className="text-5xl font-bold mb-6">
        {copy.components.photography.title}
      </h1>

      <div className="max-w-3xl text-center mb-12">
        <p className="text-lg mb-4">
          Welcome to my photography collection. Here you'll find a curated
          selection of my favorite shots, organized into themed albums. Each
          album tells its own story through carefully selected images.
        </p>
        <p className="text-lg">
          Feel free to explore the albums below and immerse yourself in the
          visual journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {albums.map((album, index) => (
          <AlbumCard
            key={album.id}
            album={album}
            delay={index}
            numberOfAlbums={albums.length}
          />
        ))}
      </div>
    </div>
  );
}
