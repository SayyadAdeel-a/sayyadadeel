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
    // The cloned sections are generated verbatim from the Webflow export, so
    // they use plain <img> with Webflow's own srcset/sizes. Swapping in
    // next/image would change rendered intrinsic dimensions and break pixel
    // parity, and Webflow emits decorative images without alt text.
    //
    // `react/no-unescaped-entities` is off for the same reason: the copy is the
    // site's own, apostrophes and all. React renders a bare `'` in JSX text
    // correctly, but escaping it — which is what this rule asks for — produces
    // literal `&#39;` in the page, because React's JSX transform decodes named
    // entities only. That was a real bug: `/licenses` rendered 19px taller on
    // mobile before it was fixed.
    files: ["src/components/sites/**/*.tsx"],
    rules: {
      "@next/next/no-img-element": "off",
      "jsx-a11y/alt-text": "off",
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;
