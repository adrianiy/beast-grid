import { useState } from 'react';
import { SectionsEnum } from '../menu-layer';
import PinSection from './pin';
import { Column, MenuHorizontalPosition } from '../../../common';
import FilterSection from './filter';
import SortSection from './sort';
import ColumnSection from './column';
import GridSection from './grid';

type Props = {
  sections: SectionsEnum[];
  column: Column;
  horizontal: MenuHorizontalPosition;
  multiSort: boolean;
  onClose: () => void;
};

export type PropsWithMouseEnter<T> = {
  onMouseEnter: () => void;
} & T;

export default function MenuSections(props: Props) {
  const { column, horizontal, multiSort, onClose } = props;
  const [activeSection, setActiveSection] = useState<SectionsEnum | undefined>(undefined);

  const handleMouseEnter = (section: SectionsEnum) => () => {
    setActiveSection(section);
  };

  const renderSection = (section: SectionsEnum) => {
    switch (section) {
      case SectionsEnum.SORT:
        return (
          <SortSection
            key={section}
            column={column}
            multiSort={multiSort}
            onMouseEnter={handleMouseEnter(section)}
          />
        );
      case SectionsEnum.PIN:
        return (
          <PinSection
            key={section}
            column={column}
            horizontal={horizontal}
            onClose={onClose}
            activeSection={activeSection}
            onMouseEnter={handleMouseEnter(section)}
          />
        );
      case SectionsEnum.FILTER:
        return (
          <FilterSection
            key={section}
            column={column}
            horizontal={horizontal}
            activeSection={activeSection}
            onMouseEnter={handleMouseEnter(section)}
          />
        );
      case SectionsEnum.GRID:
        return (
          <GridSection
            key={section}
            column={column}
            onClose={onClose}
            onMouseEnter={handleMouseEnter(section)}
          />
        );
      case SectionsEnum.COLUMN:
        return (
          <ColumnSection
            key={section}
            column={column}
            onClose={onClose}
            onMouseEnter={handleMouseEnter(section)}
          />
        );
      default:
        return null;
    }
  };

  return props.sections.map(renderSection);
}
