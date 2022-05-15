import express, { Request } from "express";
import fs from "fs";
import path from "path";
import Jimp from "jimp";
import axios from "axios";
import sharp from "sharp";

const app = express();
const port = 7653;

type Language = { name: string; url: string };

type PokemonSpecies = {
  name: string;
  names: { name: string; language: Language }[];
  genera: { genus: string; language: Language }[];
};

type PokemonInfo = {
  name: string;
  genus?: string;
};

app.get("/info/:id", async (req: Request<{ id: number }>, res) => {
  const pokemonId = req.params.id || 1;
  const externalPath = `https://pokeapi.co/api/v2/pokemon-species/${pokemonId}/`;

  const apiResp: PokemonSpecies = await (await axios.get(externalPath)).data;

  console.log();
  const result: PokemonInfo = {
    name:
      apiResp.names.find((p) => p.language.name === "en")?.name || apiResp.name,
    genus: apiResp.genera.find((p) => p.language.name === "en")?.genus,
  };
  res.json(result);
});

type QueryParams = {
  width?: string;
  height?: string;
  bg?: string;
};

app.get(
  "/image/:id",
  async (req: Request<{ id: number }, {}, {}, QueryParams>, res) => {
    const width = Number(req.query.width) || 240;
    const height = Number(req.query.height) || 320;
    const bg = "#" + (req.query.bg || "000000");

    console.log("Transforming", { width, height, bg });
    const pokemonId = req.params.id;
    const rawImagePath = path.resolve(`./assets/images/${pokemonId}.png`);

    if (!fs.existsSync(rawImagePath)) {
      //   const externalPath = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemonId}.png`;
      const externalPath = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;

      try {
        fs.writeFileSync(
          rawImagePath,
          (
            await axios.get(externalPath, {
              responseType: "arraybuffer",
            })
          ).data
        );
      } catch (err) {
        console.log("Error fetching image", err);
        res.json({ error: "does not exist" }).status(404);
      }
    }

    const imagePath = path.resolve(
      `./assets/images/${pokemonId}_${width}_${height}_${bg}.jpg`
    );
    if (!fs.existsSync(imagePath)) {
      sharp(fs.readFileSync(rawImagePath))
        .flatten({ background: bg })
        .resize(width, height, {
          background: bg,
          fit: "contain",
          kernel: "nearest",
        })
        .toFile(imagePath, (err) => {
          console.log("Manipulated file write complete");
          if (err) {
            console.log("Error manipulating image", err);
            res.json({ error: "does not exist" }).status(404);
          } else {
            res.contentType("jpeg").sendFile(imagePath);
          }
        });
    } else {
      res.contentType("jpeg").sendFile(imagePath);
    }
  }
);

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
