import livereload from "rollup-plugin-livereload";
import serve from "rollup-plugin-serve";


const dev = () => ({
  input: "index.js",
  output: {
    name: "focuz",
    file: "dev/index.js",
    format: "iife",
    sourcemap: true,
  },
  plugins: [
    serve({
      port: 2309,
      contentBase: "dev",
    }),
    livereload({
      port: 2309,
      watch: "dev",
    })
  ]
});

const configMap = new Map([
  ["dev", dev],
]);

const chosenConfig = configMap.get(process.env.BUILD_ENV);
if (chosenConfig == null)
  throw Error("You must define process.env.BUILD_ENV before building with rollup. Check rollup.config.js for valid options.");

export default chosenConfig;