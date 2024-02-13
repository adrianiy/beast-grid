import { createContext, createElement, useContext, useRef } from 'react';
import { StoreApi, useStore } from 'zustand';
import { DndStore } from './dnd-store/store';

type ExtractState<S> = S extends { getState: () => infer T } ? T : never;

const StoreContext = createContext<StoreApi<DndStore> | undefined>(undefined);

export const DndStoreProvider = ({
  createStore,
  children,
}: {
  createStore: () => StoreApi<DndStore>;
  children: React.ReactNode;
}) => {
  const storeRef = useRef<StoreApi<DndStore>>();
  if (!storeRef.current) {
    storeRef.current = createStore();
  }

  return createElement(
    StoreContext.Provider,
    { value: storeRef.current },
    children
  );
};

export const useDndStore = <T>(
  selector: (state: ExtractState<StoreApi<DndStore>>) => T
) => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('Missing StoreProvider');
  }
  return useStore(store, selector);
};
