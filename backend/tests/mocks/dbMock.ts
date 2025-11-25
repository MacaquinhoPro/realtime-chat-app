import { jest } from '@jest/globals';

export const db = () => ({
  query: jest.fn<(...args: any[]) => Promise<{ rows: any[]; rowCount: number }>>().mockResolvedValue({ rows: [], rowCount: 0 }),
});