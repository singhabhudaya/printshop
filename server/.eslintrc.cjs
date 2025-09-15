/* eslint-env node */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "import"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  env: { node: true, es2022: true },
  parserOptions: { sourceType: "module", ecmaVersion: "latest" },
  ignorePatterns: ["dist", "node_modules"],
  rules: {
    "import/order": ["warn", { "newlines-between": "always" }],
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }]
  }
};
