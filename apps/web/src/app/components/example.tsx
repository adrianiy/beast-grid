import { BeastGridConfig } from 'beast-grid';
import { User } from '../api/data';
import Grid from './grid';

export default function Example() {
  const config: Partial<BeastGridConfig<User>> = {
    headerHeight: 80,
    rowHeight: 60
  };
  return(
    <section className="demo" id="demo">
      <div className="demo-container">
        <Grid key="example" qty={25} config={config} theme="minimal-theme" /> 
      </div>
    </section>
  )
}
