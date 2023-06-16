import type { NextPage } from "next";
import { forwardRef, ComponentProps } from "react";

const features: FeatureProps[] = [
  {
    title: "Software Engineer",
    description:
      "Visual Experience Team at Stardog. Building a data visualization tool for the Semantic Graph Database.",
    link: "https://www.stardog.com/",
  },
  {
    title: "Full-Stack Developer",
    description:
      "I build applications from idea to production serving many daily users.",
    link: "https://github.com/mysticfalconvt",
  },
  {
    title: "School Dashboard Application",
    description:
      "I built this application to help teachers, students, and parents manage their school experience.",
    link: "https://boskind.tech/blog/NcujhsTechV2",
  },
  {
    title: "Math Teacher",
    description: "Teaching 8th grade math with a flare for making and code.",
    link: "https://boskind.tech/blog/TinkerCadInMathClass",
  },
  {
    title: "Coding Club",
    description:
      "Supervising a group of enthusiastic middle-schoolers creating great projects using Python or Javascript",
    link: "https://textbasedstarter-1.grimgarbage.repl.co/",
  },
  {
    title: "Polywork",
    description:
      "Polywork is a professional network where people highlight all kinds of things they do. ... No more job titles and descriptions that don't fit your work.",
    link: "https://www.polywork.com/robboskind",
  },
  {
    title: "Next.js",
    description:
      "Best developer experience with all the features you need for production: hybrid static & server rendering",
    link: "https://nextjs.org/",
  },
  {
    title: "React.js",
    description: "JavaScript library for building user interfaces.",
    link: "https://reactjs.org/",
  },
  {
    title: "Node.js",
    description: "JavaScript runtime built on Chrome's V8 JavaScript engine.",
    link: "https://nodejs.org/",
  },
  {
    title: "Express",
    description: "Fast, unopinionated, minimalist web framework for Node.js.",
    link: "https://expressjs.com/",
  },
  {
    title: "MongoDB",
    description: "NoSQL database with a JSON-like document schema.",
    link: "https://www.mongodb.com/",
  },
  {
    title: "Gatsby.js",
    description:
      "Static site generator to build fast, secure, and powerful websites using a React-based framework.",
    link: "https://boskind.tech",
  },
  {
    title: "GraphQL",
    description:
      "A query language for APIs and a runtime for fulfilling those queries with your existing data.",
    link: "https://graphql.org/",
  },
  {
    title: "React-Query",
    description:
      'Fetch, cache and update data in your React and React Native applications all without touching any "global state".',
    link: "https://react-query.tanstack.com/",
  },
  {
    title: "Styled Components",
    description:
      "Visual primitives for the component age. Use the best bits of ES6 and CSS to style your apps without stress",
    link: "https://styled-components.com/",
  },
  {
    title: "Tailwind",
    description: "A utility-first CSS framework packed with classes.",
    link: "https://tailwindcss.com/",
  },
  {
    title: "TypeScript",
    description:
      "Strongly typed programming language that builds on JavaScript.",
    link: "https://www.typescriptlang.org/",
  },
  {
    title: "Netlify",
    description: "A fully-managed platform for deploying static sites.",
    link: "https://www.netlify.com/",
  },
  {
    title: "Vercel",
    description: "Develop. Preview. Ship. For the best frontend teams.",
    link: "https://vercel.com/",
  },
  {
    title: "Linode",
    description: "A cloud platform for hosting websites and apps.",
    link: "https://www.linode.com/",
  },
];

const Button = forwardRef<
  HTMLButtonElement,
  Omit<ComponentProps<"button">, "className">
>(({ children, ...rest }, ref) => {
  return (
    <button
      ref={ref}
      className=" mx-1.5 flex-none bg-gradient-to-br from-purple-600 to-blue-600 text-white text-lg leading-6 font-semibold py-3 px-6 rounded-xl transition-all duration-200 w-max md:w-auto hover:translate-y-1 focus:outline-none focus:ring focus:border-blue-300"
      {...rest}
    >
      {children}
    </button>
  );
});

export interface FeatureProps {
  title: string;
  description: string;
  link: string;
}

const Feature = (props: FeatureProps): JSX.Element => {
  const { title, link, description } = props;
  return (
    <a href={link} className="">
      <h2 className="text-2xl transition text-transparent bg-clip-text bg-gradient-to-br from-primary to-neutral-content">
        {title} &rarr;
      </h2>
      <p className="text-lg mt-2 text-neutral-content transition">
        {description}
      </p>
    </a>
  );
};
export interface TitleProps {
  title: string;
  description: string;
}

const Title = (props: TitleProps): JSX.Element => {
  const { title, description } = props;
  return (
    <div className="flex flex-col place-content-evenly sm:flex">
      <h2 className="text-2xl sm:text-4xl leading-none font-bold tracking-tight text-gray-500 pb-4 sm:pb-0">
        <span className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-8 sm:mb-10 text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent">
          {title}
        </span>
      </h2>
      <h3 className="text-2xl sm:text-4xl leading-none font-bold tracking-tight text-gray-500 pb-4 sm:pb-0">
        {description}
      </h3>
    </div>
  );
};

const Home: NextPage = () => {
  return (
    <>
      <header className="relative max-w-screen-lg xl:max-w-screen-xl px-2 mx-auto pt-16">
        <h3 className="text-2xl sm:text-4xl leading-none font-bold tracking-tight text-base-content">
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent opacity-75">
            Robert{" "}
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-tl from-primary to-accent opacity-75">
            Boskind
          </span>
        </h3>
        <h1 className="text-5xl md:text-6xl lg:text-7xl leading-none font-extrabold tracking-tight mb-8 sm:mb-10 text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent">
          Developer & Teacher
        </h1>
        <p className="max-w-screen-lg text-lg text-base-content font-medium mb-10 sm:mb-11">
          Full-Stack Software Engineer with a passion for{" "}
          <code className="font-mono text-accent font-bold">Teaching</code>,
          {" and "}
          <code className="font-mono text-accent font-bold">Learning</code>. I
          have turned every job that I have ever had into a{" "}
          <code className="font-mono text-accent font-bold">
            software project
          </code>
          . My lastest project is the school dashboard website that I recently
          rebuilt from the ground up. This project is a full-stack web
          application that allows teachers, students, and parents to manage
          everything about their school experience. The{" "}
          <code className="font-mono text-accent font-bold">Front-End</code> is
          built with React, Next.js, Styled Components, React-Query, and
          Chart.js. The{" "}
          <code className="font-mono text-accent font-bold">Back-End</code> is
          built using Node.js, Keystone.js, Express, PostgreSQL, and GraphQL.
          This is{" "}
          <code className="font-mono text-accent font-bold">hosted</code> using
          Linode and Vercel.
        </p>
      </header>
      <section className="max-w-screen-lg xl:max-w-screen-xl px-2 flex flex-col md:flex-row gap-2 items-center md:items-baseline justify-around mx-auto mt-4 flex-wrap">
        <div className="sm:flex sm:space-x-6 space-y-4 sm:space-y-0 items-center">
          <a href="/Resume Robert Boskind.pdf">
            <Button>Resume</Button>
          </a>
        </div>
        <Title title="Experience" description="Skills and Technologies"></Title>
        <div className="sm:flex sm:space-x-6 space-y-4 sm:space-y-0 items-end">
          <a href="https://github.com/mysticfalconvt">
            <Button>Github</Button>
          </a>
        </div>
      </section>
      <section className="max-w-screen-lg xl:max-w-screen-xl px-2 mb-4 mx-auto pt-16 grid grid-cols-12 gap-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="col-span-12 sm:col-span-4 block rounded-md p-6 text-left border border-gray-200 max-w-xl h-full transition-all shadow-md bg-neutral text-neutral-content hover:bg-neutral-focus  hover:border-accent"
          >
            <Feature {...f} />
          </div>
        ))}
      </section>
    </>
  );
};

export default Home;
