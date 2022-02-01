// @ts-check
import { Readable } from "stream";
import { basename, extname } from "path";

import getImagePath from "./utils/getImagePath.mjs";
import getLoadedImage from "./utils/getLoadedImage.mjs";
import getConfigOptions from "./utils/getConfigOptions.mjs";
import getImage from "./utils/getOptimizedImage.mjs";

const optimizedImages = new Map();

const sharp = await (async () => {
  try {
    if (await import("sharp")) {
      return true;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
})();

export default {
  name: "vite-plugin-astro-image",
  enforce: "pre",
  async load(id) {
    const { search, searchParams } = new URL(`file://${id}`);

    const src = id.replace(search, "");
    const ext = extname(src).slice(1);

    if (/(heic|heif|avif|jpg|jpeg|png|tiff|webp|gif)/i.test(ext)) {
      const base = basename(src, extname(src));

      const config = Object.fromEntries(searchParams);

      const { loadedImage, imageWidth } = await getLoadedImage(src, ext, sharp);

      const { type, hash, widths, options, extension, inline } =
        getConfigOptions(config, ext, imageWidth);

      if (inline) {
        if (widths.length > 1) {
          throw new Error(
            `Cannot use base64 or raw or inline with multiple widths`
          );
        }

        const [width] = widths;

        const { assetName } = getImagePath(base, extension, width, hash);

        if (optimizedImages.has(assetName)) {
          return `export default "${optimizedImages.get(assetName)}"`;
        } else {
          const config = { width, ...options };

          const params = [src, loadedImage, config, sharp, type, true];

          // @ts-ignore
          const { dataUri } = await getImage(...params);

          optimizedImages.set(assetName, dataUri);
          return `export default "${dataUri}"`;
        }
      } else {
        const sources = await Promise.all(
          widths.map(async (width) => {
            const { name, path } = getImagePath(base, extension, width, hash);

            if (!optimizedImages.has(path)) {
              const config = { width, ...options };

              const params = [src, loadedImage, config, sharp, type];

              const image = await getImage(...params);

              // @ts-ignore
              const buffer = sharp ? null : image.buffer;

              const imageObject = { type, name, buffer, extension, image };

              optimizedImages.set(path, imageObject);
            }

            return { width, path };
          })
        );

        const path =
          sources.length > 1
            ? sources.map(({ width, path }) => `${path} ${width}w`).join(", ")
            : sources[0].path;

        return `export default "${path}"`;
      }
    }
  },

  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const imageObject = optimizedImages.get(request.url);

      if (imageObject) {
        const { type, buffer, image } = imageObject;

        response.setHeader("Content-Type", type);
        response.setHeader("Cache-Control", "no-cache");

        if (buffer) {
          return Readable.from(buffer).pipe(response);
        }

        return image.clone().pipe(response);
      }

      next();
    });
  },

  async generateBundle(_options, bundle) {
    const outputs = [];
    for (const [, output] of Object.entries(bundle)) {
      if (typeof output.source === "string") {
        outputs.push(output);
      }
    }

    await Promise.all(
      [...optimizedImages.entries()].map(async ([src, imageObject]) => {
        for (const output of outputs) {
          if (output.source.match(src)) {
            const { name, buffer, image } = imageObject;

            const fileName = this.getFileName(
              this.emitFile({
                name,
                type: "asset",
                source: buffer || (await image.clone().toBuffer()),
              })
            );

            output.source = output.source.replace(src, fileName);
          }
        }
      })
    );
  },
};
