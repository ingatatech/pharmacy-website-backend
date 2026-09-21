// Known seed accounts the test suite can always log in as. tests/setup.ts
// upserts these into the test database before every test file runs.
export const TEST_ADMIN = {
  email: "test-admin@ingata.test",
  password: "test-admin-password123",
  fullName: "Test Admin",
  role: "admin" as const,
};

export const TEST_REVIEWER = {
  email: "test-reviewer@ingata.test",
  password: "test-reviewer-password123",
  fullName: "Test Reviewer",
  role: "pharmacist_reviewer" as const,
};
