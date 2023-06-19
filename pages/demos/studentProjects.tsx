import React from "react";

export type studentProject = {
  title: string;
  description: string;
  url: string;
};

const getPhotos = () => {
  // fetch photos from the api
  // photos.boskind.tech/api/v1/config

  const photos = fetch(
    "http://photos.rboskind.com/api/v1/albums/arwgefbfv608w7e7",
    {
      // set no-cors
      mode: "no-cors",
    }
  )
    .then((res) => console.log(res))
    .catch((err) => console.log(err));

  return photos;
};

export default function studentProjects() {
  const photos = getPhotos();

  return (
    <div className="flex flex-col ">
      <h1 className="text-4xl text-base-content m-10">Student Samples</h1>
      <h2 className="text-2xl text-base-content m-10">
        Here are some of the projects my students have created. These were done
        by 7th & 8th grade students in my coding club. I hope you enjoy them!
      </h2>
    </div>
  );
}
