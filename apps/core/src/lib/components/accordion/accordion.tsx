import { ChevronDownIcon } from '@radix-ui/react-icons';
import { PropsWithChildren, useState } from 'react';

import './accordion.scss';

import cn from 'classnames';

type Props = {
    ref?: () => void;
    id: string;
    label: React.ReactNode | string;
    elements: number;
    height?: number;
    withoutArrow?: boolean;
    hideArrow?: boolean;
    style?: React.CSSProperties;
    onExpand?: (expanded: boolean) => void;
};
export default function Accordion(props: PropsWithChildren<Props>) {
    const { label, id, elements, hideArrow, withoutArrow, height, children } = props;
    const [expanded, setExpaned] = useState(false);
    const [childrenHeight, setChildrenHeight] = useState<number | string>(0);
    const [minHeight, setMinHeight] = useState(0);

    const toggleRow = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();

        if (props.onExpand) {
            props.onExpand(!expanded);
        }
        if (expanded) {
            setMinHeight(0);
            setChildrenHeight(0);
            setExpaned(false);
        } else if (height || elements) {
            setChildrenHeight(360);
            setMinHeight(360);
            setExpaned(true);
        }
    };

    return (
        <div
            ref={props.ref}
            key={id}
            id={id}
            className="bg-accordion__wrapper column left"
            onClick={toggleRow}
            style={props.style}
        >
            <div className="bg-accordion__item row middle">
                <ChevronDownIcon
                    id={`bg-accordion__arrow__${id}`}
                    style={{ opacity: hideArrow ? 0 : 1, display: withoutArrow ? 'none' : 'block' }}
                    className={cn('bg-accordion__arrow', { rotate: !expanded })}
                />
                {label}
            </div>
            <div
                className={cn('bg-accordion__children', { hidden: !expanded })}
                id={`bg-accordion__children__${id}`}
                style={{ height: childrenHeight, minHeight: minHeight, maxWidth: '-webkit-fill-available' }}
            >
                {expanded ? children : undefined}
            </div>
        </div>
    );
}
