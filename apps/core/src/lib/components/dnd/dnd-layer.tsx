import { useDndStore } from './../../stores/dnd-store';
import { EyeNoneIcon, MoveIcon } from '@radix-ui/react-icons';
import { BeastGridConfig } from '../../common';

import './dnd-layer.scss';

export default function DndLayer<T>({ config }: { config: BeastGridConfig<T>}) {
  const [dragItem, coords, pointer] = useDndStore((state) => [
    state.dragItem,
    state.coords,
    state.pointer,
  ]);

  const renderItem = () => {
    if (!dragItem || !coords || dragItem.hidePreview) return null;
    console.log(window.screenX)
    
    return (
      <BoxDragPreview
        text={dragItem.text as string}
        isInside={pointer.x > 0 && pointer.y > 0}
        top={coords?.y + 12}
        left={coords?.x + 12}
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
        <MoveIcon />
      ) : (
        <EyeNoneIcon />
      )}
      {text}
    </div>
  );
};
