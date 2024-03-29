import { useEffect, useRef } from 'react';
import SimpleBar from 'simplebar-react';
import SimpleBarCore from 'simplebar-core';

import { useBeastStore } from './stores/beast-store';

import { BeastGridConfig, Column, Data } from './common';
import TBody from './components/body/tbody';
import Header from './components/header/header';
import SideBar from './components/sidebar/sidebar';

import cn from 'classnames';

import 'simplebar-react/dist/simplebar.min.css';

type Props<T> = {
    config: BeastGridConfig<T>;
    defaultConfig: Partial<BeastGridConfig<T>>;
    theme: string;
    onSortChange?: (data: Data, sortColumns: Column[]) => Promise<Data>;
};

export default function Grid<T>({ config, defaultConfig, theme, onSortChange }: Props<T>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [setScrollElement, setTheme, autoSize] = useBeastStore((state) => [state.setScrollElement, state.setTheme, state.autoSizeColumns]);
    const ref = useRef<SimpleBarCore>(null);

    useEffect(() => {
        // resize observer
        const resizeObserver = new ResizeObserver(() => {
            if (containerRef.current) {
                autoSize();
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    useEffect(() => {
        if (ref.current) {
            setScrollElement(ref.current.getScrollElement() as HTMLDivElement);
        }
    }, [ref, setScrollElement]);

    useEffect(() => {
        setTheme(theme);
    }, [theme, setTheme]);

    const getToolbarHeight = () => {
        let toolbarHeight = 0;

        if (config.topToolbar) {
            toolbarHeight += 45;
        }
        if (config.bottomToolbar) {
            toolbarHeight += 45;
        }

        return toolbarHeight;
    }

    return (
        <div
            className="beast-grid__wrapper"
            ref={containerRef}
            style={{
                maxHeight: config.style?.maxHeight,
                height: !config.style?.maxHeight ? `calc(100% - ${getToolbarHeight()}px)` : undefined,
                width: '100%'
            }}
        >
            <SimpleBar
                style={{ width: '100%', maxHeight: config.style?.maxHeight, height: !config.style?.maxHeight ? '100%' : undefined }}
                ref={ref}
                className={cn('beast-grid__container', {
                    border: config?.style?.border,
                    headerBorder: config?.header?.border ?? true,
                })}
            >
                <Header
                    height={config.header?.height || (defaultConfig.headerHeight as number)}
                    border={config.header?.border ?? true}
                    multiSort={config.sort?.multiple}
                    dragOptions={config.dragOptions}
                />
                <TBody
                    rowHeight={config.row?.height || (defaultConfig.rowHeight as number)}
                    headerHeight={config.header?.height || (defaultConfig.headerHeight as number)}
                    config={config.row}
                    maxHeight={config.style?.maxHeight}
                    border={config.row?.border}
                    onSortChange={onSortChange}
                    events={config.row?.events}
                    beastConfig={config}
                />
            </SimpleBar>
            <SideBar config={config} />
        </div>
    );
}
