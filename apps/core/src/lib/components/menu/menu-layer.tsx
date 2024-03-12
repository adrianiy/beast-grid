import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useBeastStore } from '../../stores/beast-store';

import { Column, MenuHorizontalPosition, PinType } from '../../common';
import MenuSections from './components/sections';

import cn from 'classnames';

import './menu-layer.scss';

export enum SectionsEnum {
  SORT = 'sort',
  PIN = 'pin',
  FILTER = 'filter',
  GRID = 'grid',
  COLUMN = 'column',
}

type Props = {
  visible: boolean;
  column: Column;
  theme: string;
  multiSort: boolean;
  horizontal: MenuHorizontalPosition;
  clipRef: () => SVGSVGElement;
  onClose: () => void;
};

export default function MenuLayer(props: Props) {
  if (!props.visible) {
    return null;
  }

  return createPortal(<HeaderMenu {...props} />, document.body);
}


function HeaderMenu({ column, multiSort, theme, horizontal, clipRef, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [horizontalPosition, setHorizontalPosition] = useState<MenuHorizontalPosition>(horizontal);
  const [horizontalSubmenuPosition, setHorizontalSubmenuPosition] = useState<MenuHorizontalPosition>(horizontal);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>({ x: 0, y: 0 });

  const [container, columns] = useBeastStore(
    (state) => [
      state.scrollElement,
      state.columns,
    ]
  );

  const sections = [
    SectionsEnum.SORT,
    SectionsEnum.PIN,
    SectionsEnum.FILTER,
    SectionsEnum.GRID,
    SectionsEnum.COLUMN,
  ];

  useEffect(() => {
    const leftPinned = Object.values(columns)
      .filter((col) => col.pinned === PinType.LEFT)
      .reduce((acc, curr) => acc + curr.width, 0);

    const moveMenu = () => {
      if (!clipRef) {
        return;
      }

      const { left: cLeft, right: cRight } = container.getBoundingClientRect();
      const { width } = menuRef.current?.getBoundingClientRect() || {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: 0,
      };
      const { left, right, bottom } = clipRef().getBoundingClientRect();

      const x = window.scrollX + left;
      const y = window.scrollY + bottom + 8;

      setCoords({ x, y });

      if (right > cRight) {
        onClose();
        return;
      }
      if (left + width * 2 > cRight) {
        setHorizontalSubmenuPosition(MenuHorizontalPosition.RIGHT);
      } else {
        setHorizontalSubmenuPosition(MenuHorizontalPosition.LEFT);
      }
      if (left + width > cRight) {
        setHorizontalPosition(MenuHorizontalPosition.RIGHT);
        return;
      } else {
        setHorizontalPosition(MenuHorizontalPosition.LEFT);
      }

      if (column.pinned !== PinType.NONE) {
        return;
      }
      if (left < cLeft + leftPinned || x + width > cRight) {
        onClose();
      }
    };

    moveMenu();

    const closeMenu = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    setTimeout(() => {
      menuRef.current?.style.setProperty('overflow', 'visible');
    }, 400);

    document.addEventListener('click', closeMenu);
    container.addEventListener('scroll', moveMenu);

    return () => {
      document.removeEventListener('click', closeMenu);
      document.removeEventListener('scroll', moveMenu);
      container.removeEventListener('scroll', moveMenu);
    };
  }, []);

  return (
    <div
      ref={menuRef}
      className={cn(
        'bg-menu__container animate__animated animate__faster animate__fadeIn',
        horizontalPosition,
        theme
      )}
      style={{ top: coords?.y, left: coords?.x }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-menu__wrapper animate__animated animate__faster animate__fadeInDown">
        <MenuSections
          sections={sections}
          column={column}
          horizontal={horizontalSubmenuPosition}
          multiSort={multiSort}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
