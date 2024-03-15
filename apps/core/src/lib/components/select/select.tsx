import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { OperationType } from '../../common';

import useOnClickOutside from '../../hooks/clickOutside';

import cn from 'classnames';

import './select.scss';

export type Option = {
  value: OperationType;
  label: JSX.Element;
  active?: boolean;
};

type Props = {
  label: JSX.Element;
  options: Option[];
  activeOption?: Option;
  theme: string;
  container: HTMLDivElement | null;
  onChange: (e: Option) => void;
};
export default function Select(props: PropsWithChildren<Props>) {
  const ref = useRef<HTMLDivElement>(null);
  const { options, activeOption, label, container, theme } = props;

  const [open, setOpen] = useState(false);

  const toggleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen((state) => !state);
  };

  const handleClick = (e: Option) => {
    props.onChange(e);
    setOpen(false);
  };

  return (
    <div className="bg-select__container row middle" onClick={toggleSelect} ref={ref}>
      <label>{activeOption?.label || label}</label>
      <ChevronDownIcon />
      <Options
        options={options}
        activeOption={activeOption}
        open={open}
        theme={theme}
        inputRef={ref.current}
        container={container}
        onClose={() => setOpen(false)}
        onClick={handleClick}
      />
    </div>
  );
}

type OptionProps = {
  options: Option[];
  activeOption?: Option;
  open: boolean;
  theme: string;
  inputRef: HTMLDivElement | null;
  container: HTMLDivElement | null;
  onClose: () => void;
  onClick: (e: Option) => void;
}

const Options = (props: OptionProps) => {
  return createPortal(<OptionsPortal {...props} />, document.body);
}

const OptionsPortal = ({
  options,
  activeOption,
  open,
  theme,
  inputRef,
  container,
  onClose,
  onClick,
}: OptionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>({ x: 0, y: 0 });

  useOnClickOutside(ref, onClose);

  useEffect(() => {
    const getCoords = () => {
      if (!inputRef) return;
      const { left, bottom } = inputRef.getBoundingClientRect();
      const { top: cTop } = container?.getBoundingClientRect() || { top: 0, left: 0 };

      const x = window.scrollX + left;
      const y = window.scrollY + bottom + 4;
      const minY = cTop;

      if (minY && y < minY) {
        onClose();
        return;
      }

      setCoords({ x, y });
    };

    getCoords();

    if (container) {
      container.addEventListener('scroll', getCoords);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', getCoords);
      }
    };
  }, [inputRef, container, onClose]);

  const handleClick = (option: Option) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(option);
  };

  if (!options.length || !open || !inputRef) {
    return null;
  }

  return (
    <div ref={ref} onClick={e => e.stopPropagation()} className={cn('bg-select__options column', theme)} style={{ top: coords?.y, left: coords?.x }}>
      {options.map((option, idx) => (
        <div key={idx} className="bg-select__option row middle between" onClick={handleClick(option)}>
          {option.label}
          {option.value === activeOption?.value && <CheckIcon />}
        </div>
      ))}
    </div>
  );
};
