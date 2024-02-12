"use client"

import { useEffect, useState } from "react";
import Image from 'next/image';

import { DarkModeOutlined, GridView, LightModeOutlined, Menu } from "@mui/icons-material";
import { Box, Button, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';

import { useTheme } from "next-themes";
import { features } from "./demo";

import cn from 'classnames';


export default function Header() {
  const { setTheme, theme } = useTheme();
  const [_theme, _setTheme] = useState<string | undefined>();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    _setTheme(theme); 
    
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [theme, _setTheme]);
  
  
  const handleThemeChange = (theme: 'light' | 'dark') => () => {
    setTheme(theme);
  };
  
  const renderList = () => (
    <Box sx={{ width: 250 }} role="presentation">
      <List>
        <ListItem disablePadding>
          <ListItemButton href="#home">
            <ListItemIcon>
              <Image src="/beast.png" alt="Beast Grid" width={30} height={30} />
            </ListItemIcon>
            <ListItemText primary="BEAST GRID" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton href="#demo">
            <ListItemIcon>
              <GridView />
            </ListItemIcon>
            <ListItemText primary="Demo" />
          </ListItemButton>
        </ListItem>
        {features.map((feature, index) => (
          <ListItem key={index} disablePadding>
            <ListItemButton href={feature.id}>
              <ListItemIcon>{feature.icon}</ListItemIcon>
              <ListItemText primary={feature.title} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
  
  return (
      <div className={cn('row middle between header', scrolled && 'scrolled')}>
        <Drawer anchor="left" open={menu} onClose={() => setMenu(false)} classes={{ paper: 'drawer' }}>
          {renderList()}
        </Drawer>
        <div className="row middle left">
          <Menu onClick={() => setMenu(!menu)} />
          <Button href="#home">
            <Image src={"/beast.png"} className="logo" alt="Beast Grid" width={30} height={30} />
            <span>Beast Grid</span>
          </Button>
        </div>
        <div className="row middle right">
          <div className="row middle theme-switch">
            <DarkModeOutlined
              className={_theme === 'dark' ? 'active' : ''}
              onClick={handleThemeChange('dark')}
            />
            <LightModeOutlined
              className={_theme === 'light' ? 'active' : ''}
              onClick={handleThemeChange('light')}
            />
          </div>
          <span>Created by Adrián Insua</span>
          <a href="https://github.com/adrianiy" rel="noreferrer" target="_blank" className="avatar">
            <Image
              src="https://avatars.githubusercontent.com/u/57523779?v=4"
              alt="Adrian Insua"
              width={20}
              height={20}
            />
          </a>
        </div>
      </div>
  )
}
