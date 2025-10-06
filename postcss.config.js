// Make PostCSS config resilient to different Tailwind/PostCSS plugin packages.
// Some Tailwind major versions moved the PostCSS integration to `@tailwindcss/postcss`.
// Prefer that if installed, otherwise fall back to the classic `tailwindcss` plugin.
const hasPostcssTailwind = (() => {
  try {
    require.resolve('@tailwindcss/postcss');
    return true;
  } catch (e) {
    return false;
  }
})();

module.exports = {
  plugins: {
    // We're using Tailwind via CDN for quick development preview (in pages/_app.tsx),
    // so avoid configuring Tailwind as a PostCSS plugin here. Keep autoprefixer so
    // Next's CSS pipeline still runs safely.
    autoprefixer: {},
  },
};
