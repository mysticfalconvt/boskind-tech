import React from "react";
import { Post } from "../pages/blog";

export const BlogCard = ({ post }: { post: Post }): React.JSX.Element => {
  // trim description at the end of a word
  const descriptionTrimmed = post.description
    ?.split(" ")
    .slice(0, 15)
    .join(" ");

  return (
    <a key={post.slug} href={`/blog/${post.slug}`}>
      <div className="card w-80 sm:w-96 h-full bg-primary text-primary-content shadow-md shadow-gray-600 hover:shadow-lg hover:shadow-gray-600">
        {post.headerImage ? (
          <figure>
            <img
              src={post.headerImage}
              alt={post.description || post.title}
              className="min-h-40"
            />
          </figure>
        ) : null}
        <div className="card-body">
          <h2 className="card-title">{post.title}</h2>
          {post.description ? (
            <div
              className="tooltip tooltip-info tooltip-top tooltip-multiline"
              data-tip={post.description}
            >
              <p>
                {descriptionTrimmed === post.description
                  ? descriptionTrimmed
                  : descriptionTrimmed + "..."}
              </p>
            </div>
          ) : null}
          <div className="card-actions justify-end">
            <button className="btn">{post.date}</button>
          </div>
        </div>
      </div>
    </a>
  );
};
