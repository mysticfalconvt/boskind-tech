import React from "react";
import fs from "fs";

type Post = {
  slug: string;
  date: string;
  title: string;
  description?: string;
};

export default function BlogHome({ postsData }: { postsData: Post[] }) {
  return (
    <div className="flex flex-col prose items-center justify-center h-full">
      <h1 className="text-3xl m-10 text-base-content">Blog Home</h1>
      <div className="flex flex-wrap items-center gap-3 justify-center mx-4 h-full">
        {postsData.map((post) => {
          // trim description at the end of a word
          const descriptionTrimmed = post.description
            ?.split(" ")
            .slice(0, 15)
            .join(" ");

          return (
            <div
              className="tooltip tooltip-info tooltip-top tooltip-multiline"
              data-tip={post.description}
              key={post.slug}
            >
              <a href={`/blog/${post.slug}`}>
                <div className="card w-96 bg-primary text-primary-content shadow-md hover:shadow-2xl">
                  <div className="card-body">
                    <h2 className="card-title">{post.title}</h2>
                    <p>
                      {descriptionTrimmed === post.description
                        ? descriptionTrimmed
                        : descriptionTrimmed + "..."}
                    </p>
                    <div className="card-actions justify-end">
                      <button className="btn">{post.date}</button>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export async function getStaticProps() {
  // get all the blog post md files from the blog directory
  const posts = fs.readdirSync("blog");
  // get the front matter from each file
  const postsMarkdown = posts.map((filename) => {
    const post = fs.readFileSync(`blog/${filename}`).toString();
    return post;
  });
  // get the slug from each file name
  const slugs = posts.map((filename) => {
    return filename.replace(".md", "");
  });
  //  get the front matter from each file
  const frontMatter = postsMarkdown.map((post) => {
    const frontMatter = post.split("---")[1];
    return frontMatter;
  });
  // get the date and title from each front matter
  const dates = frontMatter.map((fm) => {
    const date = fm.split("date: ")[1].split("\n")[0];
    return new Date(date);
  });
  const titles = frontMatter.map((fm) => {
    const title = fm.split("title: ")[1].split("\n")[0];
    return title;
  });
  const descriptions = frontMatter.map((fm) => {
    const description = fm.split("description: ")[1]?.split("\n")[0];
    return description;
  });

  //   join the dates, titles and slugs into an array of objects
  const postsData = slugs
    .map((slug, index) => {
      return {
        slug,
        date: dates[index].toLocaleDateString(),
        title: titles[index],
        description: descriptions[index] || "",
      };
    })
    .sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  return {
    props: { postsData },
  };
}
