import 'react-i18next';
import { resources } from './resources';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: typeof resources.tr;
  }
}
