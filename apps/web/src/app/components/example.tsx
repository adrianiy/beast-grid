import { Button, Divider, ToggleButton, ToggleButtonGroup } from '@mui/material';

import { BeastGridConfig } from 'beast-grid';
import { User, codeBlock } from '../api/data';

import Grid from './grid';
import { CSSProperties, useState } from 'react';
import { Code as CodeIcon, GridView } from '@mui/icons-material';
import Code from './code';

import cn from 'classnames';
import DateGrid from './date-grid';

const buttonStyle: CSSProperties = {
  color: '#1976d2',
  border: '1px solid rgba(25, 118, 210, 0.5)',
};

export default function Example() {
  const [theme, setTheme] = useState('corpo-theme');
  const [count, setCount] = useState(100);
  const [view, setView] = useState('grid');
  const [dataType, setDataType] = useState('users');

  const handleThemeChange = (_: React.MouseEvent<HTMLElement>, newTheme: string) => {
    setTheme(newTheme);
  };

  const handleSizeChange = (_: React.MouseEvent<HTMLElement>, newSize: number) => {
    setCount(count + newSize);
  };
  
  const handleDataTypeChange = (_: React.MouseEvent<HTMLElement>, dataType: 'users' | 'orders') => {
    setDataType(dataType);
  };

  const handleViewChange = (view: 'grid' | 'code') => () => {
    setView(view);
  };


  const config: Partial<BeastGridConfig<User[]>> = {
    header: {
      height: 80,
      border: true,
    },
    row: {
      height: 60,
      border: true,
    },
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
            <ToggleButton style={buttonStyle} value="default-theme">
              Default Theme
            </ToggleButton>
            <ToggleButton style={buttonStyle} value="corpo-theme">
              Corpo Theme
            </ToggleButton>
            <ToggleButton style={buttonStyle} value="dark-theme">
              Dark Theme
            </ToggleButton>
          </ToggleButtonGroup>
          <Divider orientation="vertical" flexItem style={{ borderColor: '#193b5c' }} />
          <ToggleButtonGroup
            color="primary"
            size="small"
            value={dataType}
            exclusive
            onChange={handleDataTypeChange}
            aria-label="data-type"
          >
            <ToggleButton style={buttonStyle} value={'users'}>
              USERS
            </ToggleButton>
            <ToggleButton style={buttonStyle} value={'orders'}>
              DATES
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      </div>
      {view === 'code' && (
        <Code code={codeBlock} language="ts" showLineNumbers canCopy style={{ marginTop: 24 }} />
      )}
      {view === 'grid' && (
        <div className={cn('demo-container', theme)}>
          {dataType === 'users' ? (
            <Grid
              key="example"
              qty={count}
              config={theme === 'minimal-theme' ? config : undefined}
              theme={theme}
            />
          ) : (
            <DateGrid
              key="example"
              qty={count}
              config={theme === 'minimal-theme' ? config : undefined}
              theme={theme}
            />
          )}
        </div>
      )}
    </section>
  );
}
