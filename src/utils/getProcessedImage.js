// @ts-check

import fs from "fs";
import crypto from "crypto";
import {
  applyTransforms,
  builtins,
  generateTransforms,
  loadImage,
} from "./imagetools-core";

export default async (src, configOptions, globalConfigOptions) => {
  const { search, searchParams } = new URL(src, "file://");

  const paramOptions = Object.fromEntries(searchParams);

  src = src.slice(0, src.lastIndexOf(search));
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

  const { image, metadata } = await applyTransforms(
    generateTransforms({ width, height, aspect, w, h, ar }, builtins)
      .transforms,
    loadImage(`.${src}`)
  );

  const {
    width: imageWidth,
    height: imageHeight,
    format: imageFormat,
  } = metadata;

  let path = src;

  return {
    path,
    rest,
    image,
    imageWidth,
    imageHeight,
    imageFormat,
  };
};
