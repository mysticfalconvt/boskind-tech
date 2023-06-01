type Params = {
  params: {
    slug: string;
  };
};

export default function BlogPost(props: any) {
  console.log(props);
  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-3xl m-10">Blog Post</h1>
    </div>
  );
}

export async function getStaticProps({ params }: Params) {
  return {
    props: { Slug: params.slug },
  };
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: false,
  };
}
