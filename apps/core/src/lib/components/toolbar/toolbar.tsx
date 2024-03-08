import { CSVLink } from 'react-csv';
import { DownloadIcon } from '@radix-ui/react-icons';
import { BeastGridConfig } from '../../common';
import { FormattedMessage } from 'react-intl';
import { useBeastStore } from '../../stores/beast-store';
import { export_data } from '../../utils/functions';

import cn from 'classnames';

import './toolbar.scss';
import { LabelKeyObject } from 'react-csv/lib/core';

type Props<T> = {
  config: BeastGridConfig<T>;
};

export default function Toolbar<T>({ config }: Props<T>) {
  const [data, columns] = useBeastStore((state) => [state.data, state.sortedColumns]);

  if (!config.toolbar) {
    return null;
  }

  const Download = () => {
    if (!config.toolbar?.download) {
      return null;
    }

    return (
      <CSVLink className="bg-toolbar__button row middle" data={data} headers={columns.filter((column) => !column.hidden && column.final).map(c => ({ label: c.headerName, key: c.field }) as LabelKeyObject)} filename={`delta-data-${new Date().toISOString()}.csv`}>
        <DownloadIcon />
        <span>
          <FormattedMessage id="toolbar.download" defaultMessage="Download"/>
        </span>
      </CSVLink>
    );
  };

  return (
    <div className={cn("bg-toolbar row end", config.toolbar?.position)}>
      <Download />
    </div>
  );
}
