import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Downgrade widespread any-typed patterns to warnings rather than errors.
      // These are pre-existing across the entire codebase and not functional bugs.
      "@typescript-eslint/no-explicit-any": "warn",
      // Calling async data-fetching functions inside useEffect is a common,
      // intentional pattern in this codebase.
      "react-hooks/set-state-in-effect": "warn",
      // Prose text with apostrophes and quotation marks in JSX is widespread
      // and intentional; the rule adds noise without catching real bugs.
      "react/no-unescaped-entities": "off",
      // window.location.href assignment and recursive useCallback patterns
      // are used intentionally throughout the codebase.
      "react-hooks/immutability": "warn",
    },
  },
]);

export default eslintConfig;
