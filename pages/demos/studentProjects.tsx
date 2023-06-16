import React from "react";

export type studentProject = {
  title: string;
  description: string;
  url: string;
};

export default function studentProjects() {
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
