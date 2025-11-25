jest.mock("../../src/config/db", () => {
  return {
    db: () => ({
      query: jest.fn().mockResolvedValue({
        rows: [],
      }),
    }),
  };
});