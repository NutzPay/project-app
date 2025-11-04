/**
 * Sidebar configuration for Docusaurus
 * Docs will be grouped here
 */

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  defaultSidebar: [
    {
      type: "doc",
      id: "intro", // precisa existir em docs/intro.md
      label: "Introduction",
    },
  ],
};

export default sidebars;

