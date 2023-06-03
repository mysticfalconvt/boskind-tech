import fs from "fs";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { BsTwitter } from "react-icons/bs";

type StaticPropsParams = {
  params: {
    slug: string;
  };
};

type PostProps = {
  slug: string;
  date: string;
  title: string;
  postContent: string;
};

export default function BlogPost({
  slug,
  date,
  title,
  postContent,
}: PostProps) {
  return (
    <div className="flex flex-col text-base-content items-center justify-center ">
      <h1 className="text-3xl m-10">{title}</h1>
      <h2 className="text-xl">{date}</h2>
      <ReactMarkdown
        className="prose w-screen px-20"
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <SyntaxHighlighter
                children={String(children).replace(/\n$/, "")}
                language={match[1]}
                className="bg-secondary text-secondary-content mx-10 my-3 mockup-code"
              />
            ) : (
              <div className="bg-secondary text-secondary-content mx-10 my-3 mockup-code">
                <pre>
                  <code className="" {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          img({ node, className, children, ...props }) {
            return (
              <Image
                src={props.src || ""}
                alt={props.alt || ""}
                width={500}
                height={400}
                priority
                className="mx-auto my-2 rounded-lg shadow-xl"
              />
            );
          },
        }}
      >
        {postContent}
      </ReactMarkdown>
      <div className="card lg:card-side bg-accent text-accent-content glass shadow-xl m-5">
        <figure>
          <Image
            src="https://cdn.sanity.io/images/jzq9n05y/production/4552e6f0e67b8a97fdd7e4591ea9d9ce34cbb5c2-720x720.png?w=720&h=720&auto=format"
            alt="Rob Boskind"
            width={300}
            height={300}
            className="rounded-full p-5"
          />
        </figure>
        <div className="card-body">
          <h2 className="card-title">Post by: Rob Boskind</h2>
          <p>Software Engineer</p>
          <p>Former Math Teacher</p>
          <p>Code Junkey</p>
          <p>Father of all Girls</p>

          <div className="card-actions justify-end">
            <a
              href="https://twitter.com/RobBoskind"
              className="btn btn-primary"
            >
              <BsTwitter className="mr-2" /> @rBoskind
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps({ params }: StaticPropsParams) {
  console.log(params);
  const post = fs.readFileSync(`blog/${params.slug}.md`).toString();
  const frontMatter = post.split("---")[1];
  const date = frontMatter.split("date: ")[1].split("\n")[0];
  const title = frontMatter.split("title: ")[1].split("\n")[0];
  const postContent = post.split("---")[2];

  return {
    props: { slug: params.slug, date, title, postContent },
  };
}

export async function getStaticPaths() {
  const posts = fs.readdirSync("blog");
  // get the slug from each file name
  const slugs = posts.map((filename) => {
    return filename.replace(".md", "");
  });
  return {
    paths: slugs.map((slug) => {
      return {
        params: {
          slug,
        },
      };
    }),
    fallback: false,
  };
}
