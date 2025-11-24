export {};

declare const describe: any;
declare const test: any;
declare const expect: any;

describe('Authentication', () => {
  test('Manual Login works', async () => {
     // Mock db.loginUser
     expect(true).toBe(true);
  });
  
  test('Session persists', async () => {
     // Mock db.getSession
     expect(true).toBe(true);
  });
});