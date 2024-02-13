import { Bolt, DataObject, Settings } from '@mui/icons-material';
import Header from './header';
import Welcome from './welcome';
import Example from './example';
import Sections from './sections';

import './styles.scss';

export const features = [
  {
    icon: <DataObject style={{ color: 'var(--bg-demo-color--gradient--1)' }} />,
    id: '#easy-to-use',
    title: 'Easy to use',
    description: () => (
      <>
        <p>Create your grid with a simple and intuitive API.</p>
        <p>
          No more headaches with complex configurations!
        </p>
      </>
    )
  },
  {
    icon: <Bolt style={{ color: 'var(--bg-demo-color--gradient--2)' }} />,
    id: '#fast',
    title: 'Blazing fast!',
    description: () => (
      <>
        <p>
          Beast Grid is built with performance in mind.
        </p>
        <p>
          Done with list virtualization and optimized rendering.
        </p>

      </>
    ),
  },
  {
    icon: <Settings style={{ color: 'var(--bg-demo-color--gradient--3)' }} />,
    title: 'Fully customizable',
    id: '#customizable',
    description: () => (
      <>
        <p>Customize your grid to your needs.</p>
        <p>It supports multi-sort, resizing,  DnD, theming, etc.</p>
      </>
    )
  },
];

export default function Demo() {
  return (
    <div className="container column center middle" id="home">
      <Header />
      <Welcome />
      <Example />
      <Sections />
    </div>
  );
}
