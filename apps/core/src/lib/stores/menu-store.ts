import { createContext, createElement, useContext, useRef } from 'react';
import { StoreApi, useStore } from 'zustand';
import { MenuStore } from './menu-store/store';

type ExtractState<S> = S extends { getState: () => infer T } ? T : never;

const StoreContext = createContext<StoreApi<MenuStore> | undefined>(undefined);

export const MenuStoreProvider = ({
  createStore,
  children,
}: {
  createStore: () => StoreApi<MenuStore>;
  children: React.ReactNode;
}) => {
  const storeRef = useRef<StoreApi<MenuStore>>();
  if (!storeRef.current) {
    storeRef.current = createStore();
  }

  return createElement(
    StoreContext.Provider,
    { value: storeRef.current },
    children
  );
};

export const useMenuStore = <T>(
  selector: (state: ExtractState<StoreApi<MenuStore>>) => T
) => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('Missing StoreProvider');
  }
  return useStore(store, selector);
};
