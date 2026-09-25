const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  { ignores: ["node_modules"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: globals.node,
    },
    rules: {
      // Express handlers often receive arguments they don't use
      "no-unused-vars": ["error", { argsIgnorePattern: "^(_|req|res|next)$" }],
    },
  },
];
