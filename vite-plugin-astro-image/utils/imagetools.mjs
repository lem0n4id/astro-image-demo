// @ts-check
import {
  builtins,
  loadImage,
  applyTransforms,
  generateTransforms,
} from "imagetools-core";

const decodedImages = new Map();

export const getLoadedImage = async (src) => {
  if (decodedImages.has(src)) {
    return decodedImages.get(src);
  }

  const image = loadImage(src);

  const { width } = await image.metadata();

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
  const { transforms } = generateTransforms(config, builtins);

  const { image: encodedImage } = await applyTransforms(
    transforms,
    image.clone()
  );

  if (dataUri) {
    return {
      dataUri: `data:${type};base64,${(
        await encodedImage.clone().toBuffer()
      ).toString("base64")}`,
    };
  }

  return encodedImage;
};
