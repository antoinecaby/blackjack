import { Application, Assets, Sprite, Texture } from "pixi.js";
import tapis from "/assets/CasinoPack/tapis.png";
import fond from "/assets/CasinoPack/fond.jpg";
import carte from "/assets/CasinoPack/PNG/Cards/BackgroundRed.png";

const cartes = [
  "/assets/CasinoPack/PNG/Cards/club_2.png",
  "/assets/CasinoPack/PNG/Cards/club_3.png",
];

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#1099bb", resizeTo: window });
  document.body.appendChild(app.canvas);

  //Retourne une texture à partir d'une image
  const texture = await Assets.load(fond);

  const sprite = new Sprite(texture);
  sprite.width = app.screen.width;
  sprite.height = app.screen.height;
  sprite.x = 0;
  sprite.y = 0;

  app.stage.addChild(sprite);

  await Assets.load(tapis);

  const tapisSprite = new Sprite(Assets.get(tapis));
  tapisSprite.width = app.screen.width;
  tapisSprite.height = app.screen.height;

  tapisSprite.x = 0;
  tapisSprite.y = 0;

  app.stage.addChild(tapisSprite);

  // charge en cache les textures du tableau et retourne un tableau d'objets ->  non utilisable par Sprite() qui attend une texture
  await Assets.load(cartes);
  let index = 0;

  // On va donc chercher en cache le sprite correspondant à la carte que l'on veut afficher
  //const carteSprite = new Sprite(Assets.get(cartes[index]));
  const carteRetourne = await Assets.load(carte);
  const carteSprite = new Sprite(carteRetourne);
  carteSprite.width = 100;
  carteSprite.height = 150;
  carteSprite.x = app.screen.width / 2.1 - carteSprite.width / 2;
  carteSprite.y = app.screen.height / 1.5 - carteSprite.height / 2;

  const carteSprite2 = new Sprite(carteRetourne);
  carteSprite2.width = 100;
  carteSprite2.height = 150;
  carteSprite2.x = app.screen.width / 1.9 - carteSprite2.width / 2;
  carteSprite2.y = app.screen.height / 1.5 - carteSprite2.height / 2;

  carteSprite.interactive = true;
  carteSprite2.interactive = true;

  carteSprite.on("pointerdown", () => {
    console.log("Carte clicked!");
    index = (index + 1) % cartes.length;
    carteSprite.texture = Assets.get(cartes[index]);
    carteSprite.interactive = false; // Désactive l'interaction après le clic
  });

  carteSprite2.on("pointerdown", () => {
    console.log("Carte clicked!");
    index = (index + 1) % cartes.length;
    carteSprite2.texture = Assets.get(cartes[index]);
    carteSprite2.interactive = false; // Désactive l'interaction après le clic
  });
  app.stage.addChild(carteSprite);
  app.stage.addChild(carteSprite2);
})();
