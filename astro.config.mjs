import astroImagePlugin from "astro-imagetools/plugin";

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
