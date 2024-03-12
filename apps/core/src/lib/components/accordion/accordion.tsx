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

  const handleExpandRow = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    setExpaned(state => !state)
  };

  return (
    <div
      key={id}
      id={id}
      className="bg-accordion__wrapper column left"
    >
      <div className="bg-accordion__item row middle">
        <ChevronDownIcon
          id={`bg-accordion__arrow__${id}`}
          style={{ opacity: hideArrow ? 0 : 1 }}
          className={cn('bg-accordion__arrow', { rotate: !expanded })}
          onClick={handleExpandRow}
        />
        {label}
      </div>
      <div
        className={cn("bg-accordion__children", { hidden: !expanded })}
        id={`bg-accordion__children__${id}`}
        style={{ height: expanded ? (height || 37 * elements) : 0 }}
      >
        {children}
      </div>
    </div>
  );
}
