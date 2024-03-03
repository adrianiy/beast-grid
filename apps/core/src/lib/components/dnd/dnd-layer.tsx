import { useDndStore } from './../../stores/dnd-store';
import { BeastGridConfig } from '../../common';

import './dnd-layer.scss';
import { IconArrowsMove, IconEyeOff } from '@tabler/icons-react';

export default function DndLayer<T>({ config }: { config: BeastGridConfig<T>}) {
  const [dragItem, coords, pointer] = useDndStore((state) => [
    state.dragItem,
    state.coords,
    state.pointer,
  ]);

  const renderItem = () => {
    if (!dragItem || !coords || dragItem.hidePreview) return null;
    
    return (
      <BoxDragPreview
        text={dragItem.text as string}
        isInside={pointer.x > 0 && pointer.y > 0}
        top={coords?.y}
        left={coords?.x}
        hide={config?.header?.events?.onDropOutside?.hide}
      />
    );
  };

  return <div className="dnd-layer">{renderItem()}</div>;
}

interface BoxDragPreviewProps {
  text: string;
  isInside: boolean;
  top?: number;
  left?: number;
  hide?: boolean;
}

const BoxDragPreview = ({ text, isInside, top, left, hide }: BoxDragPreviewProps) => {
  return (
    <div
      className="dnd-drag-preview"
      style={{
        top,
        left,
      }}
    >
      {isInside || !hide ? (
        <IconArrowsMove size={12} />
      ) : (
        <IconEyeOff size={12} />
      )}
      {text}
    </div>
  );
};
