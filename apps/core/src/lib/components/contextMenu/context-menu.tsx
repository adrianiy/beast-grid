import { createPortal } from 'react-dom';
import { BarChartIcon, CopyIcon, DownloadIcon } from '@radix-ui/react-icons';
import { FormattedMessage } from 'react-intl';

import cn from 'classnames';

import './context-menu.scss';
import { useEffect } from 'react';

type Props = {
  x: number;
  y: number;
  theme: string;
  visible: boolean;
  onClose: () => void;
  onCopy: (withHeaders: boolean) => void;
  onExport: () => void;
}

export default function ContextMenu(props: Props) {
  if (!props.visible) {
    return null;
  }
  
  return createPortal(
    <MenuPortal {...props} />,
    document.body
  );
  
}

const MenuPortal = (props: Props) => {
  const { x, y, theme, onClose, onCopy, onExport } = props;
  
  useEffect(() => {
    const body = document.body;

    body.addEventListener('click', onClose);

    return () => {
      body.removeEventListener('click', onClose);
    }
  }, [onClose])
  
  const left = window.scrollX + x;
  const top = window.scrollY + y;
  
  const handleCopy = (withHeaders: boolean) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(withHeaders);
  }

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExport();
  }

  const handleChart = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('chart');
  }
  
  return (
    <div className={cn("bg-grid__context-menu", theme)} style={{ left, top }}>
      <div className="bg-grid__context-menu__section">
        <div className="bg-grid__context-menu__item row middle" onClick={handleCopy(false)}>
          <CopyIcon />
          <FormattedMessage id="menu.copy" />
        </div>
        <div className="bg-grid__context-menu__item row middle" onClick={handleCopy(true)}>
          <CopyIcon />
          <FormattedMessage id="menu.copyWithHeaders" />
        </div>
      </div>
      <div className="bg-grid__context-menu__section" onClick={handleChart}>
        <div className="bg-grid__context-menu__item row middle">
          <BarChartIcon />
          <FormattedMessage id="menu.chart" />
        </div>
      </div>
      <div className="bg-grid__context-menu__section" onClick={handleExport}>
        <div className="bg-grid__context-menu__item row middle">
          <DownloadIcon />
          <FormattedMessage id="menu.export" />
        </div>
      </div>
    </div>
  )
}
