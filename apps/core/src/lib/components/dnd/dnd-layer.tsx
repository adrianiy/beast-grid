import { useDndStore } from './../../stores/dnd-store';
import { EyeNoneIcon, MoveIcon } from '@radix-ui/react-icons';

import { createPortal } from 'react-dom';

import cn from 'classnames';

import './dnd-layer.scss';

type Props = {
    hide: boolean;
    text: string;
    theme: string;
    visible: boolean;
};

export default function DndLayer(props: Props) {
    if (!props.visible) return null;

    return createPortal(<BoxDragPreview {...props} />, document.body);
}

interface BoxDragPreviewProps {
    text: string;
    hide: boolean;
    theme: string;
}

const BoxDragPreview = ({ text, hide, theme }: BoxDragPreviewProps) => {
    const [coords, pointer] = useDndStore((state) => [state.coords, state.pointer]);

    if (!coords) return null;

    return (
        <div
            className={cn('dnd-drag-preview', theme)}
            style={{
                top: window.scrollY + coords?.y + 12,
                left: window.scrollX + coords?.x + 12,
            }}
        >
            {(pointer.x > 0 && pointer.y > 0) || !hide ? <MoveIcon /> : <EyeNoneIcon />}
            {text}
        </div>
    );
};
