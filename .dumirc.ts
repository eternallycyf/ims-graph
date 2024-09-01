import { defineConfig } from 'dumi';
import type { SiteThemeConfig } from 'dumi-theme-antd-style';
import { footer } from 'ims-template-config';
import path from 'path';
import { featuresZh } from './config/features';
import style from './docs/siteIndexStyle';
import { homepage, name as repo } from './package.json';

const basePath = `/${repo}/`;
const isProd = process.env.NODE_ENV === 'production';

const themeConfig: SiteThemeConfig = {
  name: repo,
  github: homepage,
  logo: isProd ? '/images/origin.png' : `/${repo}/images/origin.png`,
  hero: {
    'zh-CN': {
      description: 'Ant Design Style 文档站主题包',
      actions: [
        {
          type: 'primary',
          text: '开始使用',
          link: '/guide',
        },
        {
          text: 'Github',
          link: 'https://github.com/eternallycyf/',
          openExternal: true,
        },
      ],
      // features: featuresZh,
    },
    'en-US': {
      description: 'dumi2 theme similar to antd v5 website',
      actions: [
        {
          type: 'primary',
          text: 'Start',
          link: '/guide-en',
        },
        {
          text: 'Config',
          link: '/config-en',
        },
      ],
    },
  },
  socialLinks: { github: homepage },
  apiHeader: {
    sourceUrl: `https://github.com/eternallycyf/ims-graph/tree/master/src/components/{atomId}/index.tsx`,
    docUrl: `https://github.com/eternallycyf/ims-graph/tree/master/src/components/{atomId}/index.md`,
    pkg: 'ims-graph',
    match: ['/ims-graph/src/component'],
  },
  footerConfig: {
    bottom: '2023',
    copyright: 'Made with ❤️ by eternallycyf - AFX & 数字科技',
    columns: footer(repo),
  },
};

export default defineConfig({
  define: {
    'process.env': process.env,
  },
  base: isProd ? '/' : `/${repo}`,
  publicPath: isProd ? '/' : basePath,
  alias: {
    [repo]: path.join(__dirname, './src'),
    [repo + '/src']: path.join(__dirname, './src/*'),
  },
  favicons: [isProd ? '/images/favicon.ico' : `/${repo}/images/favicon.ico`],
  styles: [
    `html, body { background: transparent;  }
  @media (prefers-color-scheme: dark) {
    html, body { background: #0E1116; }
  }`,
    style,
  ],
  outputPath: 'docs-dist',
  devtool: isProd ? false : 'source-map',
  clickToComponent: {},
  ignoreMomentLocale: true,
  targets: { chrome: 79 },
  codeSplitting: { jsStrategy: 'granularChunks' },
  themeConfig,
  ssr: false,
  extraBabelPlugins: ['antd-style'],
  hash: true,
  mock: {},
  exportStatic: false,
  html2sketch: {},
  mfsu: {
    runtimePublicPath: true,
  },
  resolve: {
    docDirs: ['docs'],
    atomDirs: [{ type: 'component', dir: './src/components' }],
    entryFile: './src/index.ts',
    codeBlockMode: 'passive',
  },
});
