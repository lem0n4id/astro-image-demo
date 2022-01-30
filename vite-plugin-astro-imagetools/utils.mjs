// @ts-check
import { applyTransforms, builtins, generateTransforms } from "imagetools-core";
import sharp from "sharp";
import crypto from "crypto";

const decodedImages = new Map();

export const getLoadedImage = async (src) => {
  if (decodedImages.has(src)) {
    return decodedImages.get(src);
  }

  const image = sharp(src);
  const metadata = await image.metadata();

  const returnObject = {
    image,
    metadata,
  };

  decodedImages.set(src, returnObject);
  return returnObject;
};

export const getConfigOptions = (config, ext, metadata) => {
  const { w, width = w, format = ext, base64, raw, inline, ...rest } = config;

  const widths = width
    ? width.split(";").map((w) => parseInt(w))
    : [metadata.width];

  const extension = format === "jpg" ? "jpeg" : format;
  const type = `image/${extension}`;

  const options = {
    format,
    ...rest,
  };

  const hash = crypto
    .createHash("md5")
    .update(JSON.stringify(options))
    .digest("hex");

  return {
    type,
    hash,
    widths,
    options,
    extension,
    inline:
      typeof base64 === "string" ||
      typeof raw === "string" ||
      typeof inline === "string",
  };
};

export const getImagePath = (base, extension, width, hash) => {
  const name = `${base}@${width}w.${extension}`;

  const assetName = `${base}@${width}w.${hash}.${extension}`;

  const path = `/@assets/${assetName}`;
  return { name, assetName, path };
};

export const getEncodedImage = async (image, config) => {
  const { transforms } = generateTransforms(config, builtins);

  const { image: encodedImage } = await applyTransforms(transforms, image);

  return encodedImage;
};
