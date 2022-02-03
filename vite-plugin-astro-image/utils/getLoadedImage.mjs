// @ts-check
import { readFileSync } from "fs";
import { loadImage } from "imagetools-core";

const decodedImages = new Map();

export default async function getLoadedImage(src, ext, sharp) {
  if (decodedImages.has(src)) {
    return decodedImages.get(src);
  }

  let image, imageWidth;

  if (sharp) {
    image = (await import("imagetools-core")).loadImage(src);
    imageWidth = (await image.metadata()).width;
  } else {
    const buffer = readFileSync(src);
    image = (await import("@astropub/codecs"))[ext].decode(buffer);
    imageWidth = image.width;
  }

  const returnObject = {
    loadedImage: image,
    imageWidth,
  };

  decodedImages.set(src, returnObject);
  return returnObject;
}
