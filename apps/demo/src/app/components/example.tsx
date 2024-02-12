import { BeastGridConfig } from 'beast-grid';
import Grid from './grid';
import { User } from '../api/data';

export default function Example() {
  const config: Partial<BeastGridConfig<User>> = {
    headerHeight: 80,
    rowHeight: 60
  };
  return(
    <section className="demo" id="demo">
      <div className="demo-container">
        <Grid count={25} config={config} theme="minimal" /> 
      </div>
    </section>
  )
}
