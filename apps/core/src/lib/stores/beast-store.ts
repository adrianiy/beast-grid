import { MutableRefObject, createContext, createElement, useContext, useRef } from 'react';
import { StoreApi, useStore } from 'zustand';
import { GridStore } from './grid-store/store';
import { BeastGridApi } from '../common';

type ExtractState<S> = S extends { getState: () => infer T } ? T : never;

export type UseBeastStore = <T>(selector: (state: ExtractState<StoreApi<GridStore>>) => T) => T;

const StoreContext = createContext<StoreApi<GridStore> | undefined>(undefined);

export const BeastGridProvider = ({
    createStore,
    children,
}: {
    createStore: () => StoreApi<GridStore>;
    children: React.ReactNode;
}) => {
    const storeRef = useRef<StoreApi<GridStore>>();

    if (!storeRef.current) {
        storeRef.current = createStore();
    }

    return createElement(StoreContext.Provider, { value: storeRef.current }, children);
};

export const useBeastStore: UseBeastStore = (selector) => {
    const store = useContext(StoreContext);
    if (!store) {
        throw new Error('Missing StoreProvider');
    }
    return useStore(store, selector);
};

export const BeastApi = ({ store }: { store?: MutableRefObject<BeastGridApi | undefined> }) => {
    const [columns, setColumns, setLoading, setData, setEdited] = useBeastStore((state) => [
        state.columns,
        state.setColumns,
        state.setLoading,
        state.setData,
        state.setEdited,
    ]);

    if (!store) {
        return null;
    }

    store.current = { columns, setColumns, setLoading, setData, setEdited };

    return null;
};
