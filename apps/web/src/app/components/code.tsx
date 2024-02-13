'use client';

import { CSSProperties, useEffect, useState } from 'react';

import Prism from 'prismjs';
import { ContentCopy } from '@mui/icons-material';
import { Alert, Slide, SlideProps, Snackbar } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';

type Props = {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  canCopy?: boolean;
  style?: CSSProperties;
};

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export default function Code({
  code,
  language,
  showLineNumbers,
  canCopy,
  style,
}: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Prism.highlightAll();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(code.trim()).then(() => {
      setCopied(true);
    });
  };

  const handleClose = () => {
    setCopied(false);
  };

  return (
    <pre className={showLineNumbers ? 'line-numbers' : ''} style={style}>
      <code className={`language-${language}`}>{code.trim()}</code>
      {canCopy && <ContentCopy className="copy" onClick={handleCopy} />}
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={copied}
        onClose={handleClose}
        TransitionComponent={
          SlideTransition as React.ComponentType<TransitionProps>
        }
        key={'copied'}
        autoHideDuration={1200}
      >
        <Alert
          onClose={handleClose}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          Copied to clipboard!
        </Alert>
      </Snackbar>
    </pre>
  );
}
