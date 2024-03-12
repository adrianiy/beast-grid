import { CSVLink } from 'react-csv';
import { DownloadIcon, MixerHorizontalIcon, TableIcon } from '@radix-ui/react-icons';
import { BeastGridConfig, SideBarConfig, ToolbarPosition } from '../../common';
import { FormattedMessage } from 'react-intl';
import { LabelKeyObject } from 'react-csv/lib/core';
import { useBeastStore } from '../../stores/beast-store';

import './toolbar.scss';
import { useMemo } from 'react';

type Props<T> = {
  config: BeastGridConfig<T>;
  position: ToolbarPosition
};

export default function Toolbar<T>({ config, position }: Props<T>) {
  const [data, columns, setSideBarConfig, sidebar] = useBeastStore((state) => [state.data, state.sortedColumns, state.setSideBarConfig, state.sideBarConfig]);

  const toolbar = useMemo(() => position === ToolbarPosition.TOP ? config.topToolbar : config.bottomToolbar, [config, position]);

  if (!toolbar) {
    return null;
  }
  
  const handleSideBarActivation = (config: SideBarConfig) => () => {
    setSideBarConfig(sidebar === config ? null : config);
  }

  const Filter = () => {
    if (!toolbar?.filter) {
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
    if (!toolbar?.download) {
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
    if (!toolbar?.grid) {
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
    <div className="bg-toolbar row end">
      <Filter />
      <Grid />
      <Download />
    </div>
  );
}
