import { InfinitySpin } from 'react-loader-spinner';
import { useBeastStore } from '../../stores/beast-store';

import './loader.scss';
import { BeastGridConfig } from '../../common';

export function Loader({ sorting, top, maxHeight }: { sorting?: boolean, top?: number, maxHeight?: number }) {
  return (
    <div className="beast-grid__loader row middle center" style={{ top, height: maxHeight }}>
      <div className="beast-grid__loader__overlay" />
      {sorting ? (
        <span>Sorting...</span>
      ) : (
        <InfinitySpin width="200" color="var(--bg-color--3)" />
      )}
    </div>
  );
}

export default function LoaderLayer<T>({ config }: { config: BeastGridConfig<T> }) {
  const [loading, sorting, container] = useBeastStore((state) => [
    state.loading,
    state.sorting,
    state.container,
  ]);

  if (!loading && !sorting) {
    container.classList.remove('beast-grid--loading');
    return null;
  }

  container.classList.add('beast-grid--loading');

  return <Loader sorting={sorting} top={container?.scrollTop} maxHeight={config.style?.maxHeight} />;
}
