import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: <span>Beast Grid</span>,
  project: {
    link: 'https://github.com/adrianiy/beast-grid',
  },
  docsRepositoryBase: 'https://github.com/adrianiy/beast-grid',
  footer: {
    text: 'Beast Grid. Unleash your data\'s inner beast!',
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="BeastGrid" />
      <meta property="og:description" content="A powerful and flexible grid component for React" />
      <meta property="og:url" content="https://beast-grid.vercel.app" />
      
      <link rel="icon" type="image/x-icon" href="/public/favicon.ico" />
    </>
  )
}

export default config
