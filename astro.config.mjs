// import { imagetools } from "vite-imagetools";
// import astroImagePlugin from "./vite-plugin-astro-codecs/index.mjs";
import astroImagePlugin from "./vite-plugin-astro-imagetools/index.mjs";

export default {
  vite: {
    plugins: [astroImagePlugin],
  },
};
