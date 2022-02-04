// @ts-check
import { readFileSync } from "fs";

const decodedImages = new Map();

export default async function getLoadedImage(src, ext, sharp) {
  if (decodedImages.has(src)) {
    return decodedImages.get(src);
  }

  let image, imageWidth;

  if (sharp) {
    const { loadImage } = await import("imagetools-core");

    image = loadImage(src);
    imageWidth = (await image.metadata()).width;
  } else {
    const codecs = await import("@astropub/codecs");

    const format = ext === "jpeg" ? "jpg" : ext;

    const buffer = readFileSync(src);
    image = codecs[format].decode(buffer);
    imageWidth = image.width;
  }

  const returnObject = {
    loadedImage: image,
    imageWidth,
  };

  decodedImages.set(src, returnObject);
  return returnObject;
}
