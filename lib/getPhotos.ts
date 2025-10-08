export async function getPhotosFromAlbum(album: string) {
  const photoPrismUrl =
    process.env.PHOTOPRISM_URL || "http://photos.boskind.tech";
  const photoPrismUser = process.env.PHOTOPRISM_USERNAME || "admin";
  const photoPrismPassword =
    process.env.PHOTOPRISM_PASSWORD || "UOuvwS*#yZJ6MF";
  //   // login to photoprism
  //   const session = await fetch(`${photoPrismUrl}/api/v1/session/`, {
  //     method: "POST",
  //     headers: {
  //       Accept: "application/json",
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({
  //       email: photoPrismUser,
  //       password: photoPrismPassword,
  //     }),
  //   });

  const albums = await fetch(
    `${photoPrismUrl}/api/v1/photos?count=120&offset=0&s=arwgefbfv608w7e7&merged=true&country=&camera=0&order=oldest&q=`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${session.token}`,
      },
    }
  );

  const defaultAlbum = "arxa97q206lfb6ek";
  const url = `https://photos.rboskind.com/s/1dfnjcb9rb/wildlife`;
}
