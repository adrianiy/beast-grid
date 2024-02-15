import { useEffect } from 'react';

import { DragHandle, VisibilityOff } from '@mui/icons-material';
import { useDndStore } from './../../stores/dnd-store';

import './dnd-layer.scss';

export default function DndLayer() {
  const [dragItem, coords, pointer] = useDndStore((state) => [
    state.dragItem,
    state.coords,
    state.pointer,
  ]);

  useEffect(() => {
    document.addEventListener('dragover', cancel, true);
    document.addEventListener('dragenter', cancel, true);

    return () => {
      document.removeEventListener('dragover', cancel, true);
      document.removeEventListener('dragenter', cancel, true);
    };
  }, []);

  const cancel = (e: DragEvent) => {
    e.preventDefault();
    return false;
  };

  const renderItem = () => {
    if (!dragItem || !coords || dragItem.hidePreview) return null;

    return (
      <BoxDragPreview
        text={dragItem.text as string}
        isInside={pointer.x > 0 && pointer.y > 0}
        top={coords?.y}
        left={coords?.x}
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
}

const BoxDragPreview = ({ text, isInside, top, left }: BoxDragPreviewProps) => {
  return (
    <div
      className="dnd-drag-preview"
      style={{
        top,
        left,
      }}
    >
      {isInside ? (
        <DragHandle style={{ fontSize: 12 }} />
      ) : (
        <VisibilityOff style={{ fontSize: 12 }} />
      )}
      {text}
    </div>
  );
};
