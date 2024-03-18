import { BarChartIcon, DownloadIcon, MixerHorizontalIcon, TableIcon, UpdateIcon } from '@radix-ui/react-icons';
import { BeastMode, SideBarConfig, ToolBar } from '../../common';
import { FormattedMessage } from 'react-intl';
import { useBeastStore } from '../../stores/beast-store';
import { CSVLink } from 'react-csv';
import { LabelKeyObject } from 'react-csv/lib/core';

type Props = {
  toolbar: Partial<ToolBar>;
};

export const Filter = ({ toolbar }: Props) => {
  const [setSidebarConfig] = useBeastStore((state) => [state.setSideBarConfig]);

  if (!toolbar.filter) {
    return null;
  }

  return (
    <div className="bg-toolbar__button row middle" onClick={() => setSidebarConfig(SideBarConfig.FILTERS)}>
      <MixerHorizontalIcon />
      <FormattedMessage id="toolbar.filter" defaultMessage="Filters" />
    </div>
  );
};

export const Download = ({ toolbar }: Props) => {
  const [data, columns] = useBeastStore((state) => [state.initialData, state.sortedColumns]);

  if (!toolbar.download) {
    return null;
  }

  return (
    <CSVLink
      className="bg-toolbar__button row middle"
      data={data}
      headers={columns
        .filter((column) => !column.hidden && column.final)
        .map((c) => ({ label: c.headerName, key: c.field } as LabelKeyObject))}
      filename={`delta-data-${new Date().toISOString()}.csv`}
    >
      <DownloadIcon />
      <FormattedMessage id="toolbar.download" defaultMessage="Download" />
    </CSVLink>
  );
};

export const Grid = ({ toolbar }: Props) => {
  const [setSidebarConfig, mode] = useBeastStore((state) => [state.setSideBarConfig, state.mode]);

  if (!toolbar.grid || mode !== BeastMode.GRID) {
    return null;
  }

  return (
    <div className="bg-toolbar__button row middle" onClick={() => setSidebarConfig(SideBarConfig.GRID)}>
      <TableIcon />
      <FormattedMessage id="toolbar.grid" defaultMessage="Grid" />
    </div>
  );
};

export const Mode = ({ toolbar }: Props) => {
  const [mode, setMode] = useBeastStore((state) => [state.mode, state.setMode]);

  if (!toolbar.mode) {
    return null;
  }

  const opositeMode = mode === BeastMode.GRID ? BeastMode.CHART : BeastMode.GRID;

  const toggleMode = () => {
    setMode(opositeMode);
  }

  return (
    <div
      className="bg-toolbar__button row middle"
      onClick={toggleMode}
    >
      {mode === BeastMode.CHART ? <TableIcon /> : <BarChartIcon />}
      <FormattedMessage id={`toolbar.mode.${opositeMode}`} defaultMessage="Mode" />
    </div>
  );
}

export const ChartConfig = ({ toolbar }: Props) => {
  const [mode, setSidebarConfig] = useBeastStore((state) => [state.mode, state.setSideBarConfig]);

  if (!toolbar.mode || mode === BeastMode.GRID) {
    return null;
  }

  return (
    <div className="bg-toolbar__button row middle" onClick={() => setSidebarConfig(SideBarConfig.CHART)}>
      <MixerHorizontalIcon />
      <FormattedMessage id="toolbar.chartConfig" defaultMessage="Chart Config" />
    </div>
  );
}

export const Restore = ({ toolbar }: Props) => {
  const [edited, restore] = useBeastStore((state) => [state.edited, state.restore]);

  if (!edited || !toolbar.restore) {
    return null;
  }

  const restoreChanges = () => {
    restore();
  }

  return (
    <div className="bg-toolbar__button row middle" onClick={restoreChanges}>
      <UpdateIcon />
      <FormattedMessage id="toolbar.restore" defaultMessage="Restore" />
    </div>
  );
}
