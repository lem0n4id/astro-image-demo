// @ts-check
import { basename, extname } from "path";
import {
  getDecodedImage,
  getConfigOptions,
  getEncodedImage,
  getImagePath,
} from "./utils.mjs";

const encodedImages = new Map();

export default {
  name: "vite-plugin-astro-imagetools",
  enforce: "pre",
  async load(id) {
    const { search, searchParams } = new URL(`file://${id}`);

    const src = id.replace(search, "");
    const ext = extname(src).slice(1);

    if (/(heic|heif|avif|jpg|jpeg|png|tiff|webp|gif)/i.test(ext)) {
      const base = basename(src, extname(src));

      const config = Object.fromEntries(searchParams);

      const { image, metadata } = await getDecodedImage(src, ext);

      const { type, hash, widths, options, extension, inline } =
        getConfigOptions(config, ext, metadata);

      if (inline) {
        if (widths.length > 1) {
          throw new Error(
            `Cannot use base64 or raw or inline with multiple widths`
          );
        }

        const width = widths[0];

        const { assetName } = getImagePath(base, extension, width, hash);

        if (encodedImages.has(assetName)) {
          return `export default "${encodedImages.get(assetName)}"`;
        } else {
          const encodedImage = await getEncodedImage(image, {
            width,
            ...options,
          });

          const dataUri = `data:${type};base64,${(
            await encodedImage.clone().toBuffer()
          ).toString("base64")}`;

          encodedImages.set(assetName, dataUri);
          return `export default "${dataUri}"`;
        }
      } else {
        const sources = await Promise.all(
          widths.map(async (width) => {
            const { name, path } = getImagePath(base, extension, width, hash);

            if (!encodedImages.has(path)) {
              const encodedImage = await getEncodedImage(image, {
                width,
                ...options,
              });

              encodedImages.set(path, {
                type,
                name,
                extension,
                encodedImage: encodedImage.clone(),
              });
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
      const image = encodedImages.get(request.url);

      if (image) {
        const { encodedImage, type } = image;
        response.setHeader("Content-Type", type);
        response.setHeader("Cache-Control", "no-cache");
        return encodedImage.clone().pipe(response);
      }

      next();
    });
  },

  async generateBundle(_options, bundle) {
    for (const [src, image] of encodedImages.entries()) {
      for (const [id, output] of Object.entries(bundle)) {
        if (typeof output.source === "string" && output.source.match(src)) {
          const { encodedImage, name } = image;

          const fileName = this.getFileName(
            this.emitFile({
              name,
              type: "asset",
              source: await encodedImage.clone().toBuffer(),
            })
          );

          output.source = output.source.replace(src, fileName);
        }
      }
    }
  },
};
