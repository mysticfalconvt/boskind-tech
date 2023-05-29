import { copy } from "@/lib/copy";
import TextTyper from "@/components/TextTyper";

export default function Home() {
  return (
    <main className="flex  flex-col items-center justify-start ">
      <h1 className="text-4xl sm:text-5xl lg:text-8xl font-bold text-center text-primary m-5 md:m-10 lg:m-16">
        {copy.components.BoskindDigital.welcome}
      </h1>
      <TextTyper text={copy.components.BoskindDigital.copy} />
    </main>
  );
}
