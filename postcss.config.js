module.exports = {
  plugins: [
    require("@fullhuman/postcss-purgecss")({
      content: ["./frontend/src/**/*.html"],
    }),
    require("autoprefixer"),
    require("cssnano")({
      preset: "default",
    }),
  ],
};
