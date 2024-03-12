import { ChevronDownIcon } from '@radix-ui/react-icons';
import { PropsWithChildren, useState } from 'react';

import './accordion.scss';

import cn from 'classnames';

type Props = {
  id: string;
  label: React.ReactNode | string;
  elements: number;
  height?: number;
  hideArrow?: boolean;
};
export default function Accordion(props: PropsWithChildren<Props>) {
  const { label, id, elements, hideArrow, height, children } = props;
  const [expanded, setExpaned] = useState(false);
  const [childrenHeight, setChildrenHeight] = useState<number | string>(0);
  const [minHeight, setMinHeight] = useState(0);

  const toggleRow = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();

    if (expanded) {
      setChildrenHeight(0);
      setMinHeight(0);
      setExpaned(false);
    } else {
      setChildrenHeight(height || 37 * elements);
      setExpaned(true);
      
      setTimeout(() => {
        setChildrenHeight('min-content');
        setMinHeight(height || 37 * elements)
      }, 300)
    }
    
  };

  return (
    <div
      key={id}
      id={id}
      className="bg-accordion__wrapper column left"
      onClick={toggleRow}
    >
      <div className="bg-accordion__item row middle">
        <ChevronDownIcon
          id={`bg-accordion__arrow__${id}`}
          style={{ opacity: hideArrow ? 0 : 1 }}
          className={cn('bg-accordion__arrow', { rotate: !expanded })}
        />
        {label}
      </div>
      <div
        className={cn("bg-accordion__children", { hidden: !expanded })}
        id={`bg-accordion__children__${id}`}
        style={{ height: childrenHeight, minHeight: minHeight }}
      >
        {children}
      </div>
    </div>
  );
}
