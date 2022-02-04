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
      loadImage(`.${src}`)
    );

    var {
      width: imageWidth,
      height: imageHeight,
      format: imageFormat,
    } = metadata;
  } else {
    const codecs = await import("@astropub/codecs");

    const extension = extname(src);
  }

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
