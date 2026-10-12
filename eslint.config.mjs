import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "coverage/**",
      "next-env.d.ts",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
];

export default eslintConfig;
