import {
  Button,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

import { BeastGridConfig } from 'beast-grid';
import { User, codeBlock } from '../api/data';

import Grid from './grid';
import { CSSProperties, useState } from 'react';
import { Code as CodeIcon, GridView } from '@mui/icons-material';
import Code from './code';

import cn from 'classnames';

const buttonStyle: CSSProperties = {
  color: '#1976d2',
  border: '1px solid rgba(25, 118, 210, 0.5)',
};

export default function Example() {
  const [theme, setTheme] = useState('minimal-theme');
  const [count, setCount] = useState(100);
  const [view, setView] = useState('grid');

  const handleThemeChange = (
    _: React.MouseEvent<HTMLElement>,
    newTheme: string
  ) => {
    setTheme(newTheme);
  };

  const handleSizeChange = (
    _: React.MouseEvent<HTMLElement>,
    newSize: number
  ) => {
    setCount(count + newSize);
  };

  const handleViewChange = (view: 'grid' | 'code') => () => {
    setView(view);
  };

  const config: Partial<BeastGridConfig<User>> = {
    headerHeight: 80,
    rowHeight: 60,
  };
  return (
    <section className="demo" id="demo">
      <div className="row middle between button-row">
        <div className="row middle">
          <div
            className={cn('button row middle', { active: view === 'grid' })}
            onClick={handleViewChange('grid')}
          >
            <GridView />
            Grid
          </div>
          <div
            className={cn('button row middle', { active: view === 'code' })}
            onClick={handleViewChange('code')}
          >
            <CodeIcon />
            Code
          </div>
        </div>
        <div className="row middle">
          <ToggleButtonGroup
            color="primary"
            size="small"
            value={theme}
            exclusive
            onChange={handleThemeChange}
            aria-label="theme"
          >
            <ToggleButton style={buttonStyle} value="minimal-theme">
              Custom Theme
            </ToggleButton>
            <ToggleButton style={buttonStyle} value="default">
              Default Theme
            </ToggleButton>
            <ToggleButton style={buttonStyle} value="dark-theme">
              Dark Theme
            </ToggleButton>
          </ToggleButtonGroup>
          <Divider
            orientation="vertical"
            flexItem
            style={{ borderColor: '#193b5c' }}
          />
          <ToggleButtonGroup
            color="primary"
            size="small"
            exclusive
            onChange={handleSizeChange}
            aria-label="theme"
          >
            <ToggleButton style={buttonStyle} value={10000}>
              +10k Rows
            </ToggleButton>
            <ToggleButton style={buttonStyle} value={100000}>
              +100k Rows
            </ToggleButton>
            <ToggleButton style={buttonStyle} value={500000}>
              +500k Rows
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      </div>
      {view === 'code' && (
        <Code
          code={codeBlock}
          language="ts"
          showLineNumbers
          canCopy
          style={{ marginTop: 24 }}
        />
      )}
      {view === 'grid' && (
        <div className="demo-container">
          <Grid
            key="example"
            qty={count}
            config={{ ...(theme === 'minimal-theme' ? config : {}), theme }}
            theme="minimal-theme"
          />
        </div>
      )}
    </section>
  );
}
