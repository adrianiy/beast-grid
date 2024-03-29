import { useMemo } from 'react';
import { BeastGridConfig, ToolbarPosition } from '../../common';

import { ChartConfig, Download, Filter, Grid, Mode, Restore } from './options';

import './toolbar.scss';

type Props<T> = {
  config: BeastGridConfig<T>;
  position: ToolbarPosition
  onRestore?: () => void;
};

export default function Toolbar<T>({ config, position, onRestore }: Props<T>) {
  const toolbar = useMemo(() => position === ToolbarPosition.TOP ? config.topToolbar : config.bottomToolbar, [config, position]);

  if (!toolbar) {
    return null;
  }


  return (
    <div className="bg-toolbar row end">
      <Mode toolbar={toolbar} />
      <Filter toolbar={toolbar} />
      <Grid toolbar={toolbar} />
      <Restore toolbar={toolbar} callback={onRestore} />
      <Download toolbar={toolbar} />
      <ChartConfig toolbar={toolbar} />
    </div>
  );
}
