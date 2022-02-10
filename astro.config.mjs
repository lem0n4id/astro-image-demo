import astroImagePlugin from "astro-image/plugin";

export default {
  vite: {
    plugins: [astroImagePlugin],
    optimizeDeps: {
      exclude: ["@astropub/codecs", "imagetools-core", "sharp"],
    },
    ssr: {
      external: ["sharp"],
    },
  },
};
