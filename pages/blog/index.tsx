import { getAllPostsData } from "@/lib/getAllPostsData";
import React from "react";
import { BlogCard } from "../../components/BlogCard";

export type Post = {
  slug: string;
  date: string;
  title: string;
  description?: string;
  headerImage?: string;
};

export default function BlogHome({ postsData }: { postsData: Post[] }) {
  return (
    <div className="flex flex-col prose items-center justify-center h-full">
      <h1 className="text-3xl m-10 text-base-content">Blog Home</h1>
      <div className="flex flex-wrap items-fill gap-3 justify-center mx-4 h-full">
        {postsData.map((post) => (
          <BlogCard post={post} />
        ))}
      </div>
    </div>
  );
}

export async function getStaticProps() {
  const postsData = await getAllPostsData();

  return {
    props: { postsData },
  };
}
