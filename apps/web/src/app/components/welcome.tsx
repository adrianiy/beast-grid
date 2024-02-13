import Image from 'next/image';
import { GitHub } from '@mui/icons-material';
import { Button } from '@mui/material';
import { features } from './demo';
import Code from './code';

const LOGO_SIZE = 350;

export default function Welcome() {
  return (
    <section className="column left welcome">
      <div className="row between">
        <div className="column left">
          <div className="row middle">
            <h1>Beast grid</h1>
          </div>
          <h2>
            Next generation
            <br />
            Data Grid Component
          </h2>
          <h3>Unleash your data&apos;s inner beast!</h3>
          <div className="row middle misc">
            <Code
              code="npm i beast-grid"
              language={'bash'}
              canCopy
              style={{ width: 190 }}
            />
            <Button
              variant="outlined"
              href="https://github.com/adrianiy/beast-grid"
              target="_blank"
              startIcon={<GitHub />}
            >
              View Code
            </Button>
          </div>
        </div>
        <div className="logo-container row middle center">
          <div className="image-bg" />
          <Image
            src="/beast.png"
            alt="Beast Grid"
            width={LOGO_SIZE}
            height={LOGO_SIZE}
          />
        </div>
      </div>
      <div className="row middle between features">
        {features.map((feature, idx) => (
          <a href={feature.id} key={idx} className="column left feature">
            {feature.icon}
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
