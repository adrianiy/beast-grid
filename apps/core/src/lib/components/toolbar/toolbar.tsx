import { CSVLink } from 'react-csv';
import { DownloadIcon, TableIcon } from '@radix-ui/react-icons';
import { BeastGridConfig, SideBarConfig } from '../../common';
import { FormattedMessage } from 'react-intl';
import { useBeastStore } from '../../stores/beast-store';

import cn from 'classnames';

import './toolbar.scss';
import { LabelKeyObject } from 'react-csv/lib/core';

type Props<T> = {
  config: BeastGridConfig<T>;
};

export default function Toolbar<T>({ config }: Props<T>) {
  const [data, columns, setSideBarConfig] = useBeastStore((state) => [state.data, state.sortedColumns, state.setSideBarConfig]);

  if (!config.toolbar) {
    return null;
  }

  const handleGridClick = () => {
    setSideBarConfig(SideBarConfig.GRID);
  }

  const Download = () => {
    if (!config.toolbar?.download) {
      return null;
    }

    return (
      <CSVLink className="bg-toolbar__button row middle" data={data} headers={columns.filter((column) => !column.hidden && column.final).map(c => ({ label: c.headerName, key: c.field }) as LabelKeyObject)} filename={`delta-data-${new Date().toISOString()}.csv`}>
        <DownloadIcon />
        <FormattedMessage id="toolbar.download" defaultMessage="Download"/>
      </CSVLink>
    );
  };

  const Grid = () => {
    if (!config.toolbar?.grid) {
      return null;
    }

    return (
      <div className="bg-toolbar__button row middle" onClick={handleGridClick}>
        <TableIcon />
        <FormattedMessage id="toolbar.grid" defaultMessage="Grid"/>
      </div>
    );
  }

  return (
    <div className={cn("bg-toolbar row end", config.toolbar?.position)}>
      <Grid />
      <Download />
    </div>
  );
}
