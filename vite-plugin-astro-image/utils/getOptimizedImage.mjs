// @ts-check
const resizedImages = new Map();

export default async function getImage(
  src,
  image,
  config,
  sharp,
  type,
  dataUri
) {
  if (sharp) {
    const { builtins, applyTransforms, generateTransforms } = await import(
      "imagetools-core"
    );

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
  } else {
    const codecs = await import("@astropub/codecs");

    const { width, format, quality } = config;

    const resizedImageKey = `${src}@${width}`;

    const resizedImage = resizedImages.has(resizedImageKey)
      ? resizedImages.get(resizedImageKey)
      : resizedImages
          .set(resizedImageKey, await image.resize({ width }))
          .get(resizedImageKey);

    const encodedImage = quality
      ? await codecs[format].encode(resizedImage, {
          quality: parseInt(quality),
        })
      : await resizedImage.encode(type);

    const buffer = Buffer.from(encodedImage.data);

    if (dataUri) {
      return { dataUri: `data:${type};base64,${buffer.toString("base64")}` };
    }

    return { buffer };
  }
}
