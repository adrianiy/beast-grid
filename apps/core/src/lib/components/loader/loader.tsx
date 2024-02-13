import { InfinitySpin } from 'react-loader-spinner';
import { useBeastStore } from '../../stores/beast-store';

import './loader.scss';

export function Loader({ sorting }: { sorting?: boolean }) {
  return (
    <div className="beast-grid__loader row middle center">
      <div className="beast-grid__loader__overlay" />
      {sorting ? (
        <span>Sorting...</span>
      ) : (
        <InfinitySpin width="200" color="var(--bg-color--3)" />
      )}
    </div>
  );
}

export default function LoaderLayer() {
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

  return <Loader sorting={sorting} />;
}
