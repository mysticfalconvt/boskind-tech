import fs from "fs";

export const getAllPostsData = async () => {
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
  const headerImage = frontMatter.map((fm) => {
    const headerImage = fm.split("headerImage: ")[1]?.split("\n")[0];
    return headerImage;
  });

  const firstImageInPost = postsMarkdown.map((post) => {
    const firstImage = post.split("![](")[1]?.split(")")[0];

    return firstImage;
  });

  //   join the dates, titles and slugs into an array of objects
  const postsData = slugs
    .map((slug, index) => {
      return {
        slug,
        date: dates[index].toLocaleDateString(),
        title: titles[index],
        description: descriptions[index] || "",
        headerImage: headerImage[index] || firstImageInPost[index] || "",
      };
    })
    .sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  return postsData;
};
