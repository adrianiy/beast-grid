'use client';

import { User } from './../api/data';

import Code from './code';
import { BeastGridConfig } from 'beast-grid';
import Grid from './grid';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

import cn from 'classnames';

const easyBlock = `
import BeastGrid from 'beast-grid';

export default function Demo() {
  const columnDefs: ColumnDef[] = [
    { headerName: 'ID', field: 'userId' },
    { headerName: 'NAME', field: 'username' },
    { headerName: 'MAIL', field: 'email', width: 300 },
    { headerName: 'AMOUNT', field: 'money', flex: 1, formatter: (value) => numeral(value).format('0,0 $') },
    { headerName: 'ORDERS', field: 'orders', flex: 1, formatter: (value) => numeral(value).format('0,0') },
  ];
  const config: TableConfig = {
    data,
    columnDefs,
    border: true,
    mulitSort: true,
  };

  return (
    <BeastGrid config={config} />
  )
}
`;

export default function Sections() {
  const { theme: _sysTheme } = useTheme();
  const [theme, setTheme] = useState((_sysTheme || 'dark') + '-thme');
  const config: Partial<BeastGridConfig<User>> = {
    summarize: true,
    headerHeight: 80,
    rowHeight: 60,
  };
  const handleThemeChange = (
    _: React.MouseEvent<HTMLElement>,
    newTheme: string
  ) => {
    setTheme(newTheme);
  };
  
  return (
    <>
      <section id="easy-to-use" className="column start">
        <h1>Easy to use</h1>
        <p>Create your grid with a simple and intuitive API.</p>
        <p>
          Just pass your data, column definitions and configuration
          and you are ready to go.
        </p>
        <Code code={easyBlock} language="ts" showLineNumbers canCopy />
      </section>
      <section id="fast" className="column start">
        <h1>Blazing fast!</h1>
        <p>
          Beast Grid is built with <b>performance</b> in mind.
        </p>
        <p>It&apos;s fast, efficient, and easy to use.</p>
        <p>
          Done with <b>list virtualization</b> and optimized
          rendering.
        </p>

        <p>Se how it works with this simple example of 10K rows:</p>

        <div className="demo-container" style={{ marginTop: 24 }}>
          <Grid key="big" count={500000} theme="minimal-theme" config={config} />
        </div>
      </section>
      <section id="customizable" className="column start">
        <h1>Fully customizable</h1>
        <p>Customize your grid to your needs.</p>
        <p>
          It supports multi-sort, column resizing, and drag and drop.
        </p>
        <p>Add formatters, filters, and custom cell renderers.</p>
        <p>
          Create your own themes to make the grid match your
          application deisgn system.
        </p>
        <p>Everything with a simple configuration JSON object.</p>
        <div className="row middle end">
          <ToggleButtonGroup
            color="primary"
            value={theme}
            exclusive
            onChange={handleThemeChange}
            aria-label="theme"
          >
            <ToggleButton style={{ color: 'var(--bg-demo--color--1)' }} value="default">Default</ToggleButton>
            <ToggleButton style={{ color: 'var(--bg-demo--color--1)' }} value="minimal-theme">Minimal</ToggleButton>
            <ToggleButton style={{ color: 'var(--bg-demo--color--1)' }} value="dark-theme">Dark</ToggleButton>
            <ToggleButton style={{ color: 'var(--bg-demo--color--1)' }} value="light-theme">Light</ToggleButton>
          </ToggleButtonGroup>
        </div>
        <div
          className={cn('demo-container', theme === 'light' && 'outlined', theme)}
          style={{ marginTop: 24 }}
        >
          <Grid key="custom" count={25} theme={theme} config={theme === 'minimal' ? config : undefined} />
        </div>
      </section>
    </>
  );
}
