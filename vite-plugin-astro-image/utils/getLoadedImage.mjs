// @ts-check
import { readFileSync } from "fs";
import * as codecs from "@astropub/codecs";
import { loadImage } from "imagetools-core";

const decodedImages = new Map();

export default async function getLoadedImage(src, ext, sharp) {
  if (decodedImages.has(src)) {
    return decodedImages.get(src);
  }

  let image, imageWidth;

  if (sharp) {
    image = loadImage(src);
    imageWidth = (await image.metadata()).width;
  } else {
    const buffer = readFileSync(src);
    image = await codecs[ext].decode(buffer);
    imageWidth = image.width;
  }

  const returnObject = {
    loadedImage: image,
    imageWidth,
  };

  decodedImages.set(src, returnObject);
  return returnObject;
}
