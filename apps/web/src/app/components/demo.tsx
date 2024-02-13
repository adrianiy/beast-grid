import { Bolt, DataObject, Settings } from "@mui/icons-material";
import Header from "./header";
import Welcome from "./welcome";
import Example from "./example";
import Sections from "./sections";

import './styles.scss';

export const features = [
  {
    icon: <DataObject style={{ color: 'var(--bg-demo-color--gradient--1)' }} />,
    id: '#easy-to-use',
    title: 'Easy to use',
    description:
      'Create your grid with a simple and intuitive API. No more headaches with complex configurations and slow rendering.',
  },
  {
    icon: <Bolt style={{ color: 'var(--bg-demo-color--gradient--2)' }} />,
    id: '#fast',
    title: 'Blazing fast!',
    description:
      "Beast Grid is built with performance in mind. It's fast, efficient, and easy to use. It supports multi-sort, column resizing, and drag and drop.",
  },
  {
    icon: <Settings style={{ color: 'var(--bg-demo-color--gradient--3)' }} />,
    title: 'Fully customizable',
    id: '#customizable',
    description:
      'Customize your grid to your needs. Add formatters, filters, and custom cell renderers. Everyting with a simple configuration JSON object.',
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
  )
}
