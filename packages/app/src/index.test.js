import { app } from './index';
import appInner from './app';

test('index', () => {
  expect(app).toBe(appInner);
});
