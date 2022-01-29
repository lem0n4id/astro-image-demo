// import astroImagePlugin from "./vite-plugin-astro-codecs/index.mjs";
import astroImagePlugin from "./vite-plugin-astro-imagetools/index.mjs";
// import { imagetools } from "vite-imagetools";
// const astroImagePlugin = imagetools();

export default {
  vite: {
    plugins: [astroImagePlugin],
  },
};
