import { copy } from "@/lib/copy";
import TextTyper from "@/components/TextTyper";
import { demoList } from "./demos";
import { DemoCard } from "@/components/DemoCard";
import React from "react";
import { getAllPostsData } from "@/lib/getAllPostsData";
import { Post } from "./blog";
import { BlogCard } from "@/components/BlogCard";

export default function Home({ postsData }: { postsData: Post[] }) {
  const [demoIndex, setDemoIndex] = React.useState(0);
  const [blogIndex, setBlogIndex] = React.useState(0);
  const randomDemo = demoList[demoIndex];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDemoIndex((demoIndex) => (demoIndex + 1) % demoList.length);
      //blog index can't be 0 because the first one is already shown
      //  show a random other blog post
      setBlogIndex((blogIndex) => {
        const newBlogIndex = Math.floor(Math.random() * postsData.length);
        return newBlogIndex === blogIndex
          ? (newBlogIndex + 1) % postsData.length
          : newBlogIndex;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex flex-col items-center justify-start ">
      <h1 className="text-4xl sm:text-5xl lg:text-8xl font-bold text-center text-primary m-5 md:m-10 lg:m-16">
        {copy.components.BoskindDigital.welcome}
      </h1>
      <div className="flex flex-col mb-8 w-full sm:flex-row items-center justify-center">
        <TextTyper text={copy.components.BoskindDigital.copy} />
      </div>
      <div className="flex flex-col h-full sm:p-10 w-full items-center justify-center">
        <DemoCard demo={randomDemo} />
        <div className="mt-5 flex flex-col gap-4">
          <BlogCard post={postsData[0]} />
          <BlogCard post={postsData[blogIndex]} />
        </div>
      </div>
    </main>
  );
}

export async function getStaticProps() {
  const postsData = await getAllPostsData();

  return {
    props: { postsData },
  };
}
