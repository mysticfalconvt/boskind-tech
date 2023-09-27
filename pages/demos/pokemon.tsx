import CassidooFooter from "@/components/CassidooFooter";
import exp from "constants";
import { type } from "os";
import React, { use } from "react";
type Pokemon = {
  name: string;
  url: string;
};

type PokemonInfo = {
  name: string;
  sprites: {
    front_default: string;
  };
  types: {
    type: {
      name: string;
      url: string;
    };
  }[];
};

type PokemonType = {
  damage_relations: {
    double_damage_from: { name: string }[];
    double_damage_to: { name: string }[];
  };
};

export default function pokemon({ pokemonList }: { pokemonList: Pokemon[] }) {
  const [pokemon, setPokemon] = React.useState<Pokemon[]>(pokemonList);
  const [selectedPokemon, setSelectedPokemon] = React.useState<Pokemon>();
  const [pokemonTypes, setPokemonTypes] = React.useState<PokemonType[]>([]);
  const [pokemonInfo, setPokemonInfo] = React.useState<PokemonInfo>();

  React.useEffect(() => {
    if (selectedPokemon && pokemonInfo) {
      const typeURLS = pokemonInfo.types.map((t) => t.type.url);
      Promise.all(typeURLS.map((url: string) => getTypeInfo(url))).then(
        (types) => {
          console.log("types", types);
          setPokemonTypes(types);
        }
      );
    }
  }, [selectedPokemon, pokemonInfo]);

  const strongAgainst = pokemonTypes
    .reduce((acc, type) => {
      const strongAgainst = type.damage_relations.double_damage_to.map(
        (t: any) => t.name
      );
      return [...acc, ...strongAgainst];
    }, [] as string[])
    .filter((t, i, arr) => arr.indexOf(t) === i);

  const weakAgainst = pokemonTypes
    .reduce((acc, type) => {
      const weakAgainst = type.damage_relations.double_damage_from.map(
        (t: any) => t.name
      );
      return [...acc, ...weakAgainst];
    }, [] as string[])
    .filter((t, i, arr) => arr.indexOf(t) === i);

  return (
    <div className="flex flex-col sm:p-10 items-center justify-center text-base-content">
      <h1 className="text-4xl  m-10">Pokemon</h1>
      <p className="text-2xl  m-10">
        Using the pokemon API to find out what a pokemon is strong and weak
        against
      </p>
      <input
        className="m-10 p-2 border-2 border-gray-500 rounded-md"
        type="text"
        placeholder="Search for a pokemon"
        onChange={(e) => {
          const filteredPokemon = pokemonList.filter((p) =>
            p.name.includes(e.target.value)
          );
          setPokemon(filteredPokemon);
        }}
      />
      <div className="flex flex-row flex-wrap justify-center">
        {pokemon
          .map((p) => (
            <button
              key={p.name}
              className="btn btn-primary m-2"
              onClick={async () => {
                setSelectedPokemon(p);
                const Info = await getSinglePokemon(p.url);
                console.log(Info);
                setPokemonInfo(Info);
              }}
            >
              {p.name}
            </button>
          ))
          .slice(0, 10)}
      </div>
      {selectedPokemon && (
        <div className="flex flex-col items-center justify-center text-base-content">
          <h1 className="text-4xl  m-10">{selectedPokemon.name}</h1>
          <img src={pokemonInfo?.sprites.front_default} />
          <div className="flex flex-row flex-wrap justify-center">
            {pokemonInfo?.types?.map((t) => (
              <div
                className="m-2 p-2 border-2 border-gray-500 rounded-md"
                key={t.type.name}
              >
                {t.type.name}
              </div>
            ))}
          </div>
        </div>
      )}
      {strongAgainst.length ? (
        <div className="flex flex-col items-center justify-center text-base-content">
          <h1 className="text-4xl  m-10">Strong Against</h1>
          <div className="flex flex-row flex-wrap justify-center">
            {strongAgainst.map((strength) => (
              <div
                className="m-2 p-2 border-2 border-gray-500 rounded-md"
                key={strength}
              >
                {strength}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {weakAgainst.length ? (
        <div className="flex flex-col items-center justify-center text-base-content">
          <h1 className="text-4xl  m-10">Weak Against</h1>
          <div className="flex flex-row flex-wrap justify-center">
            {weakAgainst.map((weakness) => (
              <div
                className="m-2 p-2 border-2 border-gray-500 rounded-md"
                key={weakness}
              >
                {weakness}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <CassidooFooter
        newsletterLink="https://buttondown.email/cassidoo/archive/i-love-mistakes-because-its-the-only-way-you/"
        githubLink="https://github.com/mysticfalconvt/boskind-tech/blob/main/pages/demos/pokemon.tsx"
      />
    </div>
  );
}

export async function getStaticProps() {
  const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1300");
  const data = await res.json();

  return {
    props: {
      pokemonList: data.results,
    },
  };
}

const getSinglePokemon = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  return data;
};

const getTypeInfo = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  return data;
};
