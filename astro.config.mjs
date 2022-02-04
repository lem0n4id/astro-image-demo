import astroImagePlugin from "./vite-plugin-astro-image/index.mjs";

export default {
  vite: {
    plugins: [astroImagePlugin],
    optimizeDeps: {
      exclude: ["@astropub/codecs", "imagetools-core", "sharp"],
    },
    ssr: {
      external: ["@astropub/codecs", "imagetools-core", "sharp"],
    },
  },
};
