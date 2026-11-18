import { mergeConfig } from 'vite';
import base from './vite.config.js';

// `npm run dev:fake`: the real app with a fake Google sign-in, talking to dev/server.js.
export default mergeConfig(base, { resolve: { alias: [{ find: /^(\.\.?\/)+firebase\.js$/, replacement: new URL('./dev/fake-firebase.js', import.meta.url).pathname }] } });
