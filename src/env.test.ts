import { test } from 'vitest';
test('env', () => {
  console.log('ENV:', import.meta.env.MODE);
  console.log('PROCESS:', process.env.NODE_ENV);
});
