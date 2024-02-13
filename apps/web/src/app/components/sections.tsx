'use client';

import { Api, Book, Code } from '@mui/icons-material';

export default function Sections() {
  return (
    <div className="sections-container row middle center">
      <div className="left-bar" />
      <a href="https://beast-grid-docs.vercel.app" target="_blank" className="section row middle">
        <div>
          <div className="row middle section-title">
            <Book />
            <h3>Docs</h3>
          </div>
          <p>Read the full documentation to get started with Beast Grid.</p>
        </div>
      </a>
      <a href="https://beast-grid-docs.vercel.app/apidef" target="_blank" className="section row middle center">
        <div>
          <div className="row middle section-title">
            <Api />
            <h3>API</h3>
          </div>
          <p>Explore the API to learn how to use Beast Grid.</p>
        </div>
      </a>
      <a href="https://beast-grid-docs.vercel.app/examples/basic" target="_blank" className="section row middle center">
        <div>
          <div className="row middle section-title">
            <Code />
            <h3>Examples</h3>
          </div>
          <p>Check out the examples to see Beast Grid in action.</p>
        </div>
      </a>
      <div className="right-bar" />
    </div>
  );
}
