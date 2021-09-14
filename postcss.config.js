module.exports = {
  plugins: [
    require("@fullhuman/postcss-purgecss")({
      content: ["./src/frontend/**/*.html", "./src/frontend/**/*.jsx"],
    }),
    require("autoprefixer"),
    require("cssnano")({
      preset: "default",
    }),
  ],
};
