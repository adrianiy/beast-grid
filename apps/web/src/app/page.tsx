'use client';

import './numeral.config';

import 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-bash';
import 'prismjs/plugins/line-numbers/prism-line-numbers';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
import 'dracula-prism/dist/css/dracula-prism.css';

import Demo from './components/demo';
import { ThemeProvider } from 'next-themes';

export default function Index() {
  /*
   * Replace the elements below with your own.
   *
   * Note: The corresponding styles are in the ./index.scss file.
   */
  return (
    <ThemeProvider>
      <Demo />
    </ThemeProvider>
  );
}
