import React from "react";
import { FaGithubSquare } from "react-icons/fa";

type CassidooFooterProps = {
  newsletterLink: string;
  githubLink: string;
};

export default function CassidooFooter({
  newsletterLink,
  githubLink,
}: CassidooFooterProps) {
  return (
    <div className="card w-96 bg-secondary text-secondary-content shadow-xl m-2 mt-6">
      <div className="card-body">
        <p>
          This is a problem from the{" "}
          <a className="link link-secondary-content" href={newsletterLink}>
            Rendezvous with Cassidoo Newsletter
          </a>{" "}
        </p>
        <a
          className="link link-secondary-content flex items-center justify-center gap-3"
          href={githubLink}
        >
          <button className="btn btn-primary shadow-md ">
            <FaGithubSquare className="h-8 w-8" /> View Code
          </button>
        </a>
      </div>
    </div>
  );
}
