import { CSVLink } from 'react-csv';
import { DownloadIcon, MixerHorizontalIcon, TableIcon } from '@radix-ui/react-icons';
import { BeastGridConfig, SideBarConfig, ToolbarPosition } from '../../common';
import { FormattedMessage } from 'react-intl';
import { LabelKeyObject } from 'react-csv/lib/core';
import { useBeastStore } from '../../stores/beast-store';

import cn from 'classnames';

import './toolbar.scss';

type Props<T> = {
  config: BeastGridConfig<T>;
  position: ToolbarPosition
};

export default function Toolbar<T>({ config, position }: Props<T>) {
  const [data, columns, setSideBarConfig, sidebar] = useBeastStore((state) => [state.data, state.sortedColumns, state.setSideBarConfig, state.sideBarConfig]);

  if (!config.toolbar) {
    return null;
  }
  
  if ((config.toolbar?.position || ToolbarPosition.BOTTOM) !== position) {
    return null;
  }

  const handleSideBarActivation = (config: SideBarConfig) => () => {
    setSideBarConfig(sidebar === config ? null : config);
  }

  const Filter = () => {
    if (!config.toolbar?.filter) {
      return null;
    }

    return (
      <div className="bg-toolbar__button row middle" onClick={handleSideBarActivation(SideBarConfig.FILTERS)}>
        <MixerHorizontalIcon />
        <FormattedMessage id="toolbar.filter" defaultMessage="Filters"/>
      </div>
    )
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
      <div className="bg-toolbar__button row middle" onClick={handleSideBarActivation(SideBarConfig.GRID)}>
        <TableIcon />
        <FormattedMessage id="toolbar.grid" defaultMessage="Grid"/>
      </div>
    );
  }


  return (
    <div className={cn("bg-toolbar row end", config.toolbar?.position)}>
      <Filter />
      <Grid />
      <Download />
    </div>
  );
}
