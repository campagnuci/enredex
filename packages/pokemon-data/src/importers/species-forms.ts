import {
  type Database,
  species,
  forms,
  type RegionalForm,
} from "@enredex/database";
import { sql } from "drizzle-orm";
import { fetchList, fetchOne, mapConcurrent } from "../client.js";
import { genMap } from "./generations.js";

interface PokeSpecies {
  id: number;
  name: string;
  generation: { url: string };
  pokedex_numbers: { entry_number: number; pokedex: { name: string } }[];
  is_legendary: boolean;
  is_mythical: boolean;
  varieties: { is_default: boolean; pokemon: { name: string } }[];
}

function extractGen(url: string): number {
  return Number(url.match(/\/(\d+)\/?$/)![1]);
}

function regionalForm(pokemonName: string): RegionalForm | null {
  if (pokemonName.includes("-alola")) return "alolan";
  if (pokemonName.includes("-galar")) return "galarian";
  if (pokemonName.includes("-hisui")) return "hisuian";
  if (pokemonName.includes("-paldea")) return "paldean";
  return null;
}

function formType(
  formName: string,
  pokemonName: string,
): { formType: string; regionalForm: RegionalForm | null } {
  const rf = regionalForm(pokemonName);
  if (rf) return { formType: "regional", regionalForm: rf };
  if (pokemonName.includes("-mega")) return { formType: "mega", regionalForm: null };
  if (pokemonName.includes("-gmax")) return { formType: "gigantamax", regionalForm: null };
  return { formType: "other", regionalForm: null };
}

function deriveFormName(speciesName: string, pokemonName: string): string {
  if (!pokemonName.startsWith(speciesName + "-")) return pokemonName;
  return pokemonName.slice(speciesName.length + 1);
}

export async function importSpeciesAndForms(db: Database): Promise<{
  speciesCount: number;
  formsCount: number;
}> {
  const list = await fetchList("pokemon-species");
  const gMap = await genMap(db);
  const sMap = new Map<string, number>(); // species name → DB id
  let formsCount = 0;

  console.log(`  fetching ${list.length} species details...`);
  const speciesData: PokeSpecies[] = [];
  await mapConcurrent(list, async (item) => {
    const s = (await fetchOne("pokemon-species", item.name)) as PokeSpecies;
    speciesData.push(s);
  }, 5);

  speciesData.sort((a, b) => a.id - b.id);

  for (const s of speciesData) {
    const genNum = extractGen(s.generation.url);
    const nationalEntry = s.pokedex_numbers.find(
      (pn) => pn.pokedex.name === "national",
    );
    const dexNumber = nationalEntry?.entry_number ?? 0;

    // Upsert species
    await db
      .insert(species)
      .values({
        pokeapiId: s.id,
        nationalDexNumber: dexNumber,
        name: s.name,
        isLegendary: s.is_legendary,
        isMythical: s.is_mythical,
        generationId: gMap.get(genNum) ?? null,
        lastUpdatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: species.name,
        set: {
          pokeapiId: sql`EXCLUDED.pokeapi_id`,
          nationalDexNumber: sql`EXCLUDED.national_dex_number`,
          isLegendary: sql`EXCLUDED.is_legendary`,
          isMythical: sql`EXCLUDED.is_mythical`,
          generationId: sql`EXCLUDED.generation_id`,
          lastUpdatedAt: sql`now()`,
        },
      });

    // Look up the species DB id
    const [row] = await db
      .select({ id: species.id })
      .from(species)
      .where(sql`${species.pokeapiId} = ${s.id}`)
      .limit(1);
    const speciesId = row?.id;
    if (!speciesId) continue;
    sMap.set(s.name, speciesId);

    // Insert forms from varieties
    let sortOrder = 0;
    for (const variety of s.varieties) {
      const pokemonName = variety.pokemon.name;

      if (variety.is_default) {
        await db
          .insert(forms)
          .values({
            speciesId,
            name: s.name,
            formType: "standard",
            isDefault: true,
            sortOrder,
            lastUpdatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [forms.speciesId, forms.name],
            set: {
              formType: sql`EXCLUDED.form_type`,
              isDefault: sql`EXCLUDED.is_default`,
              sortOrder: sql`EXCLUDED.sort_order`,
              lastUpdatedAt: sql`now()`,
            },
          });
      } else {
        const derivedName = deriveFormName(s.name, pokemonName);
        const { formType: fType, regionalForm: rf } = formType(
          derivedName,
          pokemonName,
        );
        await db
          .insert(forms)
          .values({
            speciesId,
            name: derivedName,
            formType: fType as any,
            regionalForm: rf,
            isDefault: false,
            sortOrder,
            lastUpdatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [forms.speciesId, forms.name],
            set: {
              formType: sql`EXCLUDED.form_type`,
              regionalForm: sql`EXCLUDED.regional_form`,
              isDefault: sql`EXCLUDED.is_default`,
              sortOrder: sql`EXCLUDED.sort_order`,
              lastUpdatedAt: sql`now()`,
            },
          });
      }
      sortOrder++;
      formsCount++;
    }

    if (speciesData.indexOf(s) % 200 === 0) {
      console.log(
        `  species: ${speciesData.indexOf(s)}/${list.length} (forms: ${formsCount})`,
      );
    }
  }

  const allSpecies = await db.select().from(species);
  const allForms = await db.select().from(forms);
  return { speciesCount: allSpecies.length, formsCount: allForms.length };
}
