// @ts-check

import util from "util";
import potrace from "potrace";
import stringifyParams from "./stringifyParams";

export default async function getFallbackImage(
  src,
  placeholder,
  image,
  format,
  formatOptions,
  rest
) {
  switch (placeholder) {
    case "blurred":
      const params = stringifyParams({ ...rest, ...formatOptions[format] });
      const { default: dataUri } = await import(
        `${src}?inline&format=${format}&w=20${params}`
      );
      return dataUri;
    case "tracedSVG":
      const { function: fn, options } = formatOptions.tracedSVG;
      const traceSVG = util.promisify(potrace[fn]);
      const tracedSVG = await traceSVG(await image.toBuffer(), options);
      return `data:image/svg+xml;utf8,${tracedSVG}`;
    default:
      const { dominant } = await image.stats();
      const { r, g, b } = dominant;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" style="background: rgb(${r},${g},${b})"></svg>`;
      return `data:image/svg+xml;utf8,${svg}`;
  }
}
