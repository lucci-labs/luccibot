import 'react';

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        box: any;
        text: any;
      }
    }
  }
}