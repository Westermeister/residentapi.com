module.exports = {
  plugins: [
    require("@fullhuman/postcss-purgecss")({
      content: ["./frontend/src/**/*.html", "./frontend/src/**/*.jsx"],
    }),
    require("autoprefixer"),
    require("cssnano")({
      preset: "default",
    }),
  ],
};
