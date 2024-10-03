import { useEffect, useRef } from "react";
import { useBeastStore } from "../stores/beast-store";
import { Column } from "../common";

// TODO: el scroll provoca que se sume el ancho de la tabla
export const useScrollInViewHook = (
    options: Partial<{
        column: Column;
        onAnimationFrame: (translate: number) => void
    }>
) => {
    const ref = useRef<HTMLDivElement>(null);
    const reqAnimFrameNo = useRef<number>(0);
    const [scrollElement] = useBeastStore((state) => [state.scrollElement]);

    useEffect(() => {
        const _handleScroll = () => () => {
            if (!options.column) {
                cancelAnimationFrame(reqAnimFrameNo.current)

                return;
            }

            const transform = Math.min((scrollElement.scrollLeft - options.column.left) + 20, options.column.width - (ref.current?.clientWidth || 0) - 86);

            if (transform > 0 && !options.column.final && (options.column.childrenId?.length || 0) > 1) {
                options.onAnimationFrame?.(transform);
            } else {
                options.onAnimationFrame?.(0);
            }
        }

        if (ref.current && options.column) {
            scrollElement?.addEventListener('scroll', () => {
                reqAnimFrameNo.current = requestAnimationFrame(_handleScroll())
            });
        }

    }, [ref])

    return [ref]
}
