import { createContext, createElement, useContext, useRef } from 'react'
import { StoreApi, useStore } from 'zustand'
import { GridStore } from './grid-store/store'

type ExtractState<S> = S extends { getState: () => infer T } ? T : never;

const StoreContext = createContext<StoreApi<GridStore> | undefined>(undefined)

export const BeastGridProvider = ({ createStore, children }: { createStore: () => StoreApi<GridStore>, children: React.ReactNode }) => {
  const storeRef = useRef<StoreApi<GridStore>>()
  if (!storeRef.current) {
    storeRef.current = createStore()
  }
  
  return createElement(StoreContext.Provider, { value: storeRef.current }, children);
}

export const useBeastStore = <T>(selector: (state: ExtractState<StoreApi<GridStore>>) => T, equalityFn?: (a: T, b: T) => boolean) => {
  const store = useContext(StoreContext)
  if (!store) {
    throw new Error('Missing StoreProvider');
  }
  return useStore(store, selector, equalityFn)
}
