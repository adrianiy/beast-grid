import cn from 'classnames';
import numeral from 'numeral';

import './summary.scss';
import { useBeastStore } from './../../stores/beast-store';

type TSummaryProps = {
  height: number;
  summary: boolean;
  border?: boolean;
};

export default function Summary({ border, height, summary }: TSummaryProps) {
  const [data, container] = useBeastStore((state) => [state.data, state.container]);
  if (!summary) {
    return null;
  }
  
  return (
    <div className={cn('grid-summary row middle', border && 'bordered')} style={{ height, top: container.getBoundingClientRect().height - height }}>
      Rows: { numeral((data as unknown[]).length).format('0,0 a') }
    </div>
  );
}
