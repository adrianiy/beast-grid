import { useMemo } from 'react';
import { BeastGridConfig, ToolbarPosition } from '../../common';

import { ChartConfig, Custom, Download, DownloadExcel, Filter, Grid, Mode, Pivot, Redo, Restore, Undo } from './options';

import './toolbar.scss';

type Props<T> = {
    config: BeastGridConfig<T>;
    position: ToolbarPosition;
    title?: React.ReactNode;
    onRestore?: () => void;
};

export default function Toolbar<T>({ config, position, title, onRestore }: Props<T>) {
    const toolbarLeft = useMemo(
        () => (position === ToolbarPosition.TOP ? config.topLeftToolbar : config.bottomLeftToolbar),
        [config, position]
    );
    const toolbarRight = useMemo(
        () => (position === ToolbarPosition.TOP ? config.topToolbar : config.bottomToolbar),
        [config, position]
    );

    if (!toolbarLeft && !toolbarRight) {
        return null;
    }

    return (
        <div className="bg-toolbar row middle between">
            {title}
            {
                [toolbarLeft, toolbarRight].map((toolbar, idx) => {
                    return toolbar ? (<div key={idx} className="bg-toolbar__element row">
                        <Undo toolbar={toolbar} />
                        <Redo toolbar={toolbar} />
                        <Mode toolbar={toolbar} />
                        <Filter toolbar={toolbar} />
                        <Grid toolbar={toolbar} />
                        <Pivot toolbar={toolbar} />
                        <Restore toolbar={toolbar} callback={onRestore} />
                        <Download toolbar={toolbar} />
                        <DownloadExcel toolbar={toolbar} />
                        <ChartConfig toolbar={toolbar} />
                        <Custom toolbar={toolbar} />
                    </div>) : <div key={idx}></div>
                })
            }
        </div>
    );
}
