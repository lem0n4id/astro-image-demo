// @ts-check

export default function getImagePath(base, extension, width, hash) {
  const name = `${base}@${width}w.${extension}`;

  const assetName = `${base}@${width}w.${hash}.${extension}`;

  const path = `/@assets/${assetName}`;

  return { name, assetName, path };
}
