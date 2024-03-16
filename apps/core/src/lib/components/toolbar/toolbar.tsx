import { useMemo } from 'react';
import { BeastGridConfig, ToolbarPosition } from '../../common';

import { Download, Filter, Grid, Mode } from './options';

import './toolbar.scss';

type Props<T> = {
  config: BeastGridConfig<T>;
  position: ToolbarPosition
};

export default function Toolbar<T>({ config, position }: Props<T>) {
  const toolbar = useMemo(() => position === ToolbarPosition.TOP ? config.topToolbar : config.bottomToolbar, [config, position]);

  if (!toolbar) {
    return null;
  }


  return (
    <div className="bg-toolbar row end">
      <Mode toolbar={toolbar} />
      <Filter toolbar={toolbar} />
      <Grid toolbar={toolbar} />
      <Download toolbar={toolbar} />
    </div>
  );
}
