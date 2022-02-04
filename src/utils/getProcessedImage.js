// @ts-check

import fs from "fs";
import crypto from "crypto";
import { extname } from "path";

export default async (src, sharp, configOptions, globalConfigOptions) => {
  const { search, searchParams } = new URL(src, "file://");

  const paramOptions = Object.fromEntries(searchParams);

  src = src.replace(search, "");

  if (src.match("(http://|https://|data:image/).*")) {
    const hash = crypto.createHash("sha256").update(src).digest("hex");
    const directory = "node_modules/.cache";
    const filepath = `${directory}/${hash}.jpeg`;
    fs.existsSync(directory) || fs.mkdirSync(directory);
    fs.existsSync(filepath) ||
      fs.writeFileSync(
        filepath,
        Buffer.from(await (await fetch(src)).arrayBuffer())
      );
    src = `/${filepath}`;
  }

  const path = src;

  configOptions = { ...globalConfigOptions, ...paramOptions, ...configOptions };

  configOptions.aspect &&= `${configOptions.aspect}`;
  configOptions.ar &&= `${configOptions.ar}`;

  const {
    w,
    h,
    ar,
    width = w,
    height = h,
    aspect = ar,
    ...rest
  } = configOptions;

  if (sharp) {
    const { applyTransforms, builtins, generateTransforms, loadImage } =
      await import("imagetools-core");

    var { image, metadata } = await applyTransforms(
      generateTransforms({ width, height, aspect }, builtins).transforms,
      loadImage(`.${path}`)
    );

    var {
      width: imageWidth,
      height: imageHeight,
      format: imageFormat,
    } = metadata;
  } else {
    const codecs = await import("@astropub/codecs");

    const extension = extname(path).slice(1);

    // @ts-ignore
    var imageFormat = extension === "jpeg" ? "jpg" : extension;

    const buffer = fs.readFileSync(src);
    const decodedImage = await codecs.jpg.decode(buffer);

    // @ts-ignore
    var { width: imageWidth = width, height: imageHeight = height } =
      decodedImage;

    if (!(width && height) && aspect) {
      if (width) {
        imageHeight = width / aspect;
      } else if (height) {
        imageWidth = height * aspect;
      } else {
        imageHeight = decodedImage.width / aspect;
      }
    }

    // @ts-ignore
    image =
      imageWidth || imageHeight
        ? // @ts-ignore
          await decodedImage.resize({ width: imageWidth, height: imageHeight })
        : decodedImage;
  }

  return {
    path,
    rest,
    image,
    imageWidth,
    imageHeight,
    imageFormat,
  };
};
