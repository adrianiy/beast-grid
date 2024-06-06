import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import SimpleBar from 'simplebar-react';
import SimpleBarCore from 'simplebar-core';

import { useBeastStore } from './stores/beast-store';

import { BeastGridConfig, Column, Data } from './common';
import Header from './components/header/header';
import SideBar from './components/sidebar/sidebar';

import 'simplebar-react/dist/simplebar.min.css';
import TBody from './components/body/tbody';

import cn from 'classnames';

type Props<T> = {
    config: BeastGridConfig<T>;
    defaultConfig: Partial<BeastGridConfig<T>>;
    theme: string;
    disableColumnSwap?: boolean;
    onSortChange?: (data: Data, sortColumns: Column[]) => Promise<Data>;
};

export default function Grid<T>({ config, defaultConfig, theme, disableColumnSwap, onSortChange }: Props<T>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pivot, setScrollElement, setTheme, autoSize, updateColumnVisibility] = useBeastStore((state) => [
        state.pivot,
        state.setScrollElement,
        state.setTheme,
        state.autoSizeColumns,
        state.updateColumnVisibility
    ]);
    const [loading, setLoading] = useState(false);
    const [scrollTop, setScrollTop] = useState(0);
    const ref = useRef<SimpleBarCore>(null);
    const lastScrollLeft = useRef(0);

    // Get visible column slice based on left position
    const handleScroll = useCallback(
        (scrollElement: HTMLElement) => () => {
            const scrollLeft = scrollElement.scrollLeft;
            const scrollDiff = Math.abs(scrollLeft - lastScrollLeft.current);

            setScrollTop(scrollElement.scrollTop);

            if (scrollDiff > 100) {
                lastScrollLeft.current = scrollLeft;
                updateColumnVisibility(scrollLeft)
                return;
            }

        },
        [updateColumnVisibility]
    );

    // resize observer
    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            if (containerRef.current) {
                autoSize();

                const scrollElement = ref.current?.getScrollElement() as HTMLDivElement;

                if (scrollElement) {
                    handleScroll(scrollElement)();
                }
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [autoSize, handleScroll]);

    // Handle scroll element
    useEffect(() => {
        const scrollElement = ref.current?.getScrollElement() as HTMLDivElement;

        if (scrollElement) {
            setScrollElement(scrollElement);
            handleScroll(scrollElement)();
            updateColumnVisibility(0);

            scrollElement.addEventListener('scroll', handleScroll(scrollElement));
        }

        return () => {
            scrollElement?.removeEventListener('scroll', handleScroll(scrollElement));
        };
    }, [ref, setScrollElement, handleScroll]);

    // Set theme
    useEffect(() => {
        setTheme(theme);
    }, [theme, setTheme]);

    // Set loading on pivot change
    useEffect(() => {
        setLoading(true);

        setTimeout(() => {
            setLoading(false);
        }, 0);
    }, [pivot]);


    const getToolbarHeight = () => {
        let toolbarHeight = 0;

        if (config.topToolbar) {
            toolbarHeight += 45;
        }
        if (config.bottomToolbar) {
            toolbarHeight += 45;
        }

        return toolbarHeight;
    };

    return (
        <div
            className="beast-grid__wrapper"
            ref={containerRef}
            style={{
                maxHeight: config.style?.maxHeight,
                height: !config.style?.maxHeight ? `calc(100% - ${getToolbarHeight()}px)` : undefined,
                width: '100%',
            }}
        >
            <SimpleBar
                style={{
                    width: '100%',
                    maxHeight: config.style?.maxHeight,
                    height: !config.style?.maxHeight ? '100%' : undefined,
                }}
                ref={ref}
                className={cn('beast-grid__container', {
                    border: config?.style?.border,
                    headerBorder: config?.header?.border ?? true,
                })}
            >
                {!loading && (
                    <Fragment>
                        <Header
                            height={config.header?.height || (defaultConfig.headerHeight as number)}
                            border={config.header?.border ?? true}
                            multiSort={config.sort?.multiple}
                            dragOptions={config.dragOptions}
                            disableSwapColumns={disableColumnSwap}
                        />
                        <TBody
                            rowHeight={config.row?.height || (defaultConfig.rowHeight as number)}
                            headerHeight={config.header?.height || (defaultConfig.headerHeight as number)}
                            config={config.row}
                            maxHeight={config.style?.maxHeight}
                            border={config.row?.border}
                            events={config.row?.events}
                            beastConfig={config}
                            scrollTop={scrollTop}
                            onSortChange={onSortChange}
                        />
                    </Fragment>
                )}
            </SimpleBar>
            <SideBar config={config} theme={theme} />
        </div>
    );
}
