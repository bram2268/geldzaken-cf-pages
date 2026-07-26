import { handle } from 'hono/cloudflare-pages';
import api from '../../src/api/index';

export const onRequest = handle(api);
