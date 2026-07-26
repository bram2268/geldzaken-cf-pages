import { Hono } from 'hono';
import { authApi } from './auth';
import { dataApi } from './data';

const api = new Hono<{ Bindings: { DB: any }, Variables: { user: any } }>().basePath('/api');

api.route('/auth', authApi);
api.route('/data', dataApi);

export default api;
