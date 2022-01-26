// @ts-check
import * as codecs from "@astropub/codecs";
import { readFileSync } from "fs";

const decodedImages = new Map();
const resizedImages = new Map();

export const getDecodedImage = async (src, ext) => {
  if (decodedImages.has(src)) {
    return decodedImages.get(src);
  }

  const buffer = readFileSync(src);
  const image = await codecs[ext].decode(buffer);

  const key = `${src}@${image.width}`;

  resizedImages.set(key, image);
  decodedImages.set(src, image);
  return image;
};

export const getResizedImage = async (src, width, image) => {
  const key = `${src}@${width}`;

  if (resizedImages.has(key)) {
    return resizedImages.get(key);
  }

  const resizedImage = await codecs.resize(image, { width });

  resizedImages.set(key, resizedImage);
  return resizedImage;
};

export const getConfigOptions = (config, ext, image) => {
  const { w, width = w, format = ext, quality, base64, raw, inline } = config;

  const imageFormat = format === "jpeg" ? "jpg" : format;

  const widths = width
    ? width.split(";").map((w) => parseInt(w))
    : [image.width];

  const extension = imageFormat === "jpg" ? "jpeg" : imageFormat;
  const type = `image/${extension}`;

  return {
    type,
    widths,
    quality,
    extension,
    format: imageFormat,
    inline:
      typeof base64 === "string" ||
      typeof raw === "string" ||
      typeof inline === "string",
  };
};
