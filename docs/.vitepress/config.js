import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'AI Brief',
  description: 'AI-powered content generation pipeline for opencode and Claude Code',
  lang: 'en-US',
  base: '/ai-brief/',
  head: [
    ['link', { rel: 'icon', href: '/ai-brief/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#8A2BE2' }],
  ],
  themeConfig: {
    logo: '/ai-brief-logo.svg',
    siteTitle: 'AI Brief',
    search: { provider: 'local' },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/mmornati/ai-brief' },
    ],
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'GitHub', link: 'https://github.com/mmornati/ai-brief' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is AI Brief?', link: '/guide/what-is-ai-brief' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Installation', link: '/guide/installation' },
          ],
        },
        {
          text: 'Usage',
          items: [
            { text: 'CLI Commands', link: '/guide/usage' },
            { text: 'Pipeline', link: '/guide/pipeline' },
            { text: 'Output Formats', link: '/guide/formats' },
            { text: 'Templates', link: '/guide/templates' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Customization', link: '/guide/customization' },
            { text: 'Development', link: '/guide/development' },
            { text: 'Architecture', link: '/guide/architecture' },
          ],
        },
      ],
    },
    footer: {
      message: 'MIT License — Built with ❤️ by mmornati',
      copyright: 'Copyright 2026-present mmornati',
    },
  },
});