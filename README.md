# Astro JS Image Optimization Demo

This is a demonstration of the built-in `<Image>` component of the Astro JS framework. 

The main `<Image>` component is located at `src/components/Image.astro`. It's imported in the `src/pages/index.astro` file. Two images are also available for testing in the `src/images` directory.

## How to start the demo locally

1. Clone this repository 
1. Run `yarn install` to install the dependencies.
1. Run `yarn start` to start the demo.

## Steps to use this component in your astro project

1. Copy dependencies part from the package.json file inside your package.json
    ```json
    "dependencies": {
        "astro": "^0.21.12",
        "imagetools-core": "^3.0.1",
        "potrace": "^2.1.8",
        "sharp": "^0.29.3",
        "vite-imagetools": "^4.0.1"
    }
    ```

2. Copy the following from `astro.config.mjs` into your `astro.config.mjs`
    ```mjs
    vite: {
        plugins: [imagetools()],
    },
    image: {
        formats: ["webp", "png", "jpg", "jpeg", "gif"],
    }
    ```

3. Copy the `components`, `utils`, `interfaces`, `styles` directories into your src directory

4. Import Image in the files where you need it:
    ```astro
    ---
    import Image from "../components/Image.astro";
    ---

    <Image
    src="/src/images/elva-800w.jpg"
    alt="A father holiding his beloved daughter in his arms"
    artDirectives={[
        {
        media: "(max-width: 480px)",
        src: "/src/images/elva-480w-close-portrait.jpg",
        },
    ]}
    />
    ```

5. run `npm install` inside your project

6. then `npm start`