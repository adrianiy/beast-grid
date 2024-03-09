'use client'

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import BeastGridWrapper from './bg';

export default function Grid() {
  const initialized = useRef(false);
  const placeholder = useRef(null);
  const shadowRoot = useRef(null);

  useEffect(() => {
    const host = placeholder.current;
    if (host == null || initialized.current) {
      return;
    }
    initialized.current = true;
    shadowRoot.current = host.parentNode.attachShadow({ mode: "open" });
    console.log(shadowRoot.current)
  }, [placeholder])


  const attachShadow = (host) => {
    if (host == null || initialized.current) {
      return;
    }
    initialized.current = true;
    host.attachShadow({ mode: "open" });
    host.shadowRoot.innerHTML = host.innerHTML;
    host.innerHTML = "";
  }

  return <div>
    {
      !initialized.current ? <div ref={placeholder} /> : createPortal(
        <BeastGridWrapper />,
        shadowRoot.current
      )
    }
  </div>
}
