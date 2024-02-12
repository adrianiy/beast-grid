import cn from 'classnames';
import numeral from 'numeral';

import './summary.scss';
import { useBeastStore } from './../../stores/beast-store';

type TSummaryProps<TData> = {
  data: TData[];
  height: number;
  summary: boolean;
  border?: boolean;
};

export default function Summary<TData>({ data, border, height, summary }: TSummaryProps<TData>) {
  const [container] = useBeastStore((state) => [state.container]);
  if (!summary) {
    return null;
  }
  
  return (
    <div className={cn('grid-summary row middle', border && 'bordered')} style={{ height, top: container.getBoundingClientRect().height - height }}>
      Rows: { numeral(data.length).format('0,0 a') }
    </div>
  );
}
