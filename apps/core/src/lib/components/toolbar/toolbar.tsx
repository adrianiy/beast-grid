import { DownloadIcon } from '@radix-ui/react-icons';
import { BeastGridConfig } from '../../common';
import { FormattedMessage } from 'react-intl';
import { export_data } from '../../utils/functions';

import './toolbar.scss';
import { useBeastStore } from '../../stores/beast-store';

type Props<T> = {
  config: BeastGridConfig<T>;
};

export default function Toolbar<T>({ config }: Props<T>) {
  const [data, columns] = useBeastStore((state) => [state.data, state.sortedColumns]);
  
  if (!config.toolbar) {
    return null;
  }

  const handleDownload = async () => {
    await export_data(data, columns)
  };

  const Download = () => {
    if (!config.toolbar?.download) {
      return null;
    }

    return (
      <div className="bg-toolbar__button row middle" onClick={handleDownload}>
        <DownloadIcon />
        <FormattedMessage id="toolbar.download" />
      </div>
    );
  };

  return (
    <div className="bg-toolbar row end between">
      <div className="bg-toolbar__left"></div>
      <div className="bg-toolbar__right row middle end">
        <Download />
      </div>
    </div>
  );
}
