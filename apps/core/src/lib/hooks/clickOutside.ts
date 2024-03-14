import { RefObject, useEffect } from "react";

export default function useOnClickOutside(ref: RefObject<HTMLElement>, callback: (event: MouseEvent) => void, ignoreClasses: string[] = []): void {
  function handleClick(event: MouseEvent) {
    if (ignoreClasses.length > 0) {
      for (const ignoreClass of ignoreClasses) {
        if ((event.target as HTMLElement).closest(ignoreClass)) {
          return;
        }
      }
    }
    if (ref.current && !ref.current.contains(event.target as Node)) {
      callback(event);
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClick, true);
    return () => document.removeEventListener('mousedown', handleClick, true);
  });
}
