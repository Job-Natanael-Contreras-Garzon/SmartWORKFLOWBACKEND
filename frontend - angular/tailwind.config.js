/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "on-primary": "#002584", "inverse-on-surface": "#2f3037", "surface-container-low": "#1a1b22", 
        "on-tertiary-fixed": "#380d00", "surface-container-highest": "#33343c", "secondary-container": "#3c4a5e", 
        "primary-container": "#1e40af", "on-error": "#690005", "outline-variant": "#444653", "on-tertiary": "#5a1b00", 
        "surface-container-lowest": "#0d0e14", "primary": "#b8c4ff", "background": "#12131a", "primary-fixed-dim": "#b8c4ff", 
        "primary-fixed": "#dde1ff", "tertiary-fixed-dim": "#ffb59a", "on-tertiary-container": "#ffa583", 
        "on-secondary-fixed-variant": "#3a485b", "surface-dim": "#12131a", "on-secondary-container": "#abb9d1", 
        "surface-variant": "#33343c", "inverse-primary": "#3755c3", "error": "#ffb4ab", "on-tertiary-fixed-variant": "#802a00", 
        "tertiary-fixed": "#ffdbce", "on-surface-variant": "#c4c5d5", "on-primary-fixed": "#001453", 
        "surface-container-high": "#282a31", "outline": "#8e909f", "inverse-surface": "#e3e1eb", "surface": "#12131a", 
        "surface-bright": "#383940", "surface-container": "#1e1f26", "on-primary-fixed-variant": "#173bab", "tertiary": "#ffb59a", 
        "on-surface": "#e3e1eb", "error-container": "#93000a", "on-secondary": "#233144", "on-background": "#e3e1eb", 
        "tertiary-container": "#872d00", "secondary": "#b9c7df", "on-secondary-fixed": "#0d1c2e", "surface-tint": "#b8c4ff", 
        "secondary-fixed-dim": "#b9c7df", "secondary-fixed": "#d5e3fc", "on-primary-container": "#a8b8ff", "on-error-container": "#ffdad6"
      },
      borderRadius: {
        DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", full: "9999px"
      },
      spacing: {
        gutter: "16px", stack_md: "16px", stack_lg: "24px", base_unit: "4px", container_margin: "24px", stack_sm: "8px"
      },
      fontFamily: {
        headline: ["Inter", "sans-serif"], display: ["Inter", "sans-serif"], body: ["Inter", "sans-serif"], 
        label: ["Inter", "sans-serif"], mono: ["Roboto Mono", "monospace"], "label-caps": ["Inter", "sans-serif"], 
        "code-mono": ["Roboto Mono", "monospace"], "display-lg": ["Inter", "sans-serif"], "headline-md": ["Inter", "sans-serif"], 
        "title-sm": ["Inter", "sans-serif"], "body-base": ["Inter", "sans-serif"], "body-sm": ["Inter", "sans-serif"]
      },
      fontSize: {
        "label-caps": ["12px", {lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600"}], 
        "code-mono": ["14px", {lineHeight: "20px", fontWeight: "400"}], 
        "display-lg": ["30px", {lineHeight: "36px", letterSpacing: "-0.02em", fontWeight: "700"}], 
        "headline-md": ["24px", {lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600"}], 
        "title-sm": ["18px", {lineHeight: "28px", fontWeight: "600"}], 
        "body-base": ["16px", {lineHeight: "24px", fontWeight: "400"}], 
        "body-sm": ["14px", {lineHeight: "20px", fontWeight: "400"}]
      }
    },
  },
  plugins: [],
}
