export type Photo = {
  url: string;
  title: string;
  description: string;
};

export const panoramaList: Photo[] = [
  {
    url: "https://photos.rboskind.com/api/v1/t/f664c038e3ff19820ee8bb2eb4fffed4dc3812aa/35562ksr/fit_3840",
    title: "Newport Docks",
    description:
      "This is a panorama of the Newport City Docks, with the gateway center and the big tour boat.",
  },
  {
    url: "https://photos.rboskind.com/api/v1/t/1f15a4cf515462c78bbdd0b7e487dd49d7e48b92/35562ksr/fit_3840",
    title: "Memphremagog Islands",
    description:
      "This is a panorama of lake Memprhemagog showing the islands and the mountains in the background.",
  },
  {
    url: "https://photos.rboskind.com/api/v1/t/6f82cce58e23db0d26aabd421401708c7075591d/35562ksr/fit_3840",
    title: "Newport City Skyline",
    description:
      "This is a panorama of the Newport City Skyline, from the state building to the marina.",
  },
  {
    url: "https://photos.rboskind.com/api/v1/t/a1bc4c078d570796f4a4729e2efec5479101ce9c/35562ksr/fit_3840",
    title: "Jay Peak over Lake Memphremagog",
    description: "This is a panorama of Jay Peak over Lake Memphremagog",
  },
];

export const landscapeList: Photo[] = [
  {
    url: "https://photos.rboskind.com/api/v1/t/88f7dbdc633b96b9cd381b8b794ef7246d876ab9/35562ksr/fit_3840",
    title: "Headlights on Main St Newport",
    description:
      "This is a landscape photo of headlights on Main St Newport.  It was taken in the evening with a long exposure.",
  },
  {
    url: "https://photos.rboskind.com/api/v1/t/dca8812c0a4b4642afa02491c7bd2f5ba3d20169/35562ksr/fit_3840",
    title: "Stars over Lake Memphremagog",
    description:
      "This is a landscape photo of stars over Lake Memphremagog.  It was taken at night (3AM) with a very long exposure.",
  },
  {
    url: "https://photos.rboskind.com/api/v1/t/2c367210ccaed008be0c783fd80f7daecfffe66a/35562ksr/fit_3840",
    title: "Saint Mary's Church",
    description: "This is a landscape photo of Saint Mary's Church.",
  },
];

export const photoAlbums: { [key: string]: Photo[] } = {
  panorama: panoramaList,
  landscape: landscapeList,
};
