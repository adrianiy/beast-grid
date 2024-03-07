import { DownloadIcon } from '@radix-ui/react-icons';
import { BeastGridConfig } from '../../common';
import { FormattedMessage } from 'react-intl';
import { useBeastStore } from '../../stores/beast-store';
import { export_data } from '../../utils/functions';

import cn from 'classnames';

import './toolbar.scss';

type Props<T> = {
  config: BeastGridConfig<T>;
};

export default function Toolbar<T>({ config }: Props<T>) {
  const [data, columns] = useBeastStore((state) => [state.data, state.sortedColumns]);
  
  if (!config.toolbar) {
    return null;
  }

  const handleDownload = async () => {
    await export_data(data, columns.filter((column) => !column.hidden && column.final))
  };

  const Download = () => {
    if (!config.toolbar?.download) {
      return null;
    }

    return (
      <div className={cn("bg-toolbar__button row middle", config.toolbar?.position)} onClick={handleDownload}>
        <DownloadIcon />
        <label>
          <FormattedMessage id="toolbar.download" />
        </label>
      </div>
    );
  };

  return (
    <div className={cn("bg-toolbar row end between", config.toolbar?.position)}>
      <div className="bg-toolbar__left"></div>
      <div className="bg-toolbar__right row middle end">
        <Download />
      </div>
    </div>
  );
}
