// @ts-check
import { basename, extname } from "path";
import * as codecs from "@astropub/codecs";
import { Readable } from "stream";
import {
  getDecodedImage,
  getResizedImage,
  getConfigOptions,
} from "./utils.mjs";

const encodedImages = new Map();

export default {
  name: "vite-plugin-astro-codecs",
  enforce: "pre",
  async load(id) {
    const { search, searchParams } = new URL(`file://${id}`);

    const src = id.replace(search, "");
    const ext = extname(src).slice(1);

    if (/(avif|jpeg|jpg|jxl|png|webp|wp2)/i.test(ext)) {
      const base = basename(src, extname(src));

      const config = Object.fromEntries(searchParams);

      const image = await getDecodedImage(src, ext);

      const { type, widths, quality, extension, format, inline } =
        getConfigOptions(config, ext, image);

      if (inline) {
        if (widths.length > 1) {
          throw new Error(
            `Cannot use base64 or raw or inline with multiple widths`
          );
        }
        const width = widths[0];

        const assetName = `${base}@${width}w${
          quality ? `@${quality}%` : ""
        }.${extension}`;

        if (encodedImages.has(assetName)) {
          return `export default "${encodedImages.get(assetName)}"`;
        } else {
          const resizedImage = await getResizedImage(src, width, image);

          const encodedImage = await codecs[format].encode(
            resizedImage,
            quality ? { quality: parseInt(quality) } : {}
          );

          const dataUri = `data:${type};base64,${Buffer.from(
            encodedImage
          ).toString("base64")}`;

          encodedImages.set(assetName, dataUri);
          return `export default "${dataUri}"`;
        }
      } else {
        const sources = await Promise.all(
          widths.map(async (width) => {
            const name = `${base}@${width}w.${extension}`;

            const assetName = `${base}@${width}w${
              quality ? `@${quality}%` : ""
            }.${extension}`;

            const path = `/@assets/${assetName}`;

            if (!encodedImages.has(path)) {
              const resizedImage = await getResizedImage(src, width, image);

              const encodedImage = await codecs[format].encode(
                resizedImage,
                quality ? { quality: parseInt(quality) } : {}
              );

              const buffer = Buffer.from(encodedImage);

              encodedImages.set(path, {
                type,
                buffer,
                name,
                extension,
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
        const { buffer, type } = image;
        response.setHeader("Content-Type", type);
        response.setHeader("Cache-Control", "no-cache");
        return Readable.from(buffer).pipe(response);
      }
      next();
    });
  },

  async generateBundle(_options, bundle) {
    for (const [src, image] of encodedImages.entries()) {
      console.log(src);
      for (const [id, output] of Object.entries(bundle)) {
        if (typeof output.source === "string" && output.source.match(src)) {
          const { buffer, name } = image;

          const fileName = this.getFileName(
            this.emitFile({
              name,
              type: "asset",
              source: buffer,
            })
          );

          output.source = output.source.replace(src, fileName);
        }
      }
    }
  },
};
