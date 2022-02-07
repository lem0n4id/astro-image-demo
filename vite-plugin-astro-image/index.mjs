// @ts-check
import { Readable } from "stream";
import { basename, extname } from "path";
import { getConfigOptions, getImagePath } from "./utils/shared.mjs";

const optimizedImages = new Map();

const sharp = await (async () => {
  try {
    if (await import("sharp")) {
      return true;
    }
  } catch (error) {
    return false;
  }
})();

// @ts-ignore
const { getLoadedImage, getTransformedImage } = await import(
  `./utils/${sharp ? "imagetools" : "codecs"}.mjs`
);

const supportedFileTypes = [
  "avif",
  "jpeg",
  "jpg",
  "png",
  "webp",
  ...(sharp ? ["heic", "heif", "tiff", "gif"] : ["jxl", "wp2"]),
];

export default {
  name: "vite-plugin-astro-image",
  enforce: "pre",
  async load(id) {
    try {
      var fileURL = new URL(`file://${id}`);
    } catch (error) {
      return null;
    }

    const { search, searchParams } = fileURL;

    const src = id.replace(search, "");
    const ext = extname(src).slice(1);

    if (supportedFileTypes.includes(ext)) {
      const base = basename(src, extname(src));

      const config = Object.fromEntries(searchParams);

      const { image: loadedImage, width: imageWidth } = await getLoadedImage(
        src,
        ext
      );

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

          const params = [src, loadedImage, config, type, true];

          const { dataUri } = await getTransformedImage(...params);

          optimizedImages.set(assetName, dataUri);

          return `export default "${dataUri}"`;
        }
      } else {
        const sources = await Promise.all(
          widths.map(async (width) => {
            const { name, path } = getImagePath(base, extension, width, hash);

            if (!optimizedImages.has(path)) {
              const config = { width, ...options };

              const params = [src, loadedImage, config, type];

              const image = await getTransformedImage(...params);

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
