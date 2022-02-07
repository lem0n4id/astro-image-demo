// @ts-check
import * as codecs from "@astropub/codecs";
import { readFileSync } from "fs";

const decodedImages = new Map();
const resizedImages = new Map();

export const getLoadedImage = async (src, ext) => {
  if (decodedImages.has(src)) {
    return decodedImages.get(src);
  }

  const buffer = readFileSync(src);

  const image = await codecs[ext].decode(buffer);

  const key = `${src}@${image.width}`;

  resizedImages.set(key, image);

  const { width } = image;

  const returnObject = {
    image,
    width,
  };

  decodedImages.set(src, returnObject);

  return returnObject;
};

export const getTransformedImage = async (
  src,
  image,
  config,
  type,
  dataUri
) => {
  const { width, format, quality } = config;

  const resizedImageKey = `${src}@${width}`;

  const resizedImage =
    resizedImages.get(resizedImageKey) ||
    resizedImages
      .set(resizedImageKey, await image.resize({ width }))
      .get(resizedImageKey);

  const encodedImage = quality
    ? await codecs[format].encode(resizedImage, {
        quality: parseInt(quality),
      })
    : await resizedImage.encode(type);

  const buffer = Buffer.from(encodedImage.data);

  if (dataUri) {
    return { dataUri: `data:${type};base64,${buffer.toString("base64")}` };
  }

  return { buffer };
};
