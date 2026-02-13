import { describe, it } from "node:test";
import { getMockContext, getMockUser } from "@/test/test_util/test_util";
import { authRouter } from "@/server/routers/auth";
import assert from "node:assert";

describe("User Auth", async () => {
  const randomNumber = Math.floor(Math.random() * 100);
  it("Sign Up", async () => {
    // Arrange
    const ctx = getMockContext();
    const mockUser = getMockUser(randomNumber);

    // Act
    const response = await authRouter.createCaller(ctx).signup(mockUser);

    // Assert
    assert.notEqual(response.user.id, undefined);
    assert.notEqual(response.token, undefined);
  });

  it("Sign Up Fail Date of Birth", async () => {
    // Arrange
    const ctx = getMockContext();
    const mockUser = getMockUser(randomNumber);
    mockUser.dateOfBirth = "01/01/2066";
    let hasError = false;

    // Act
    try {
      await authRouter.createCaller(ctx).signup(mockUser);
    } catch {
      hasError = true;
    }

    // Assert
    assert.equal(hasError, true);
  });

  it("Sign Up Fail Invalid Email", async () => {
    // Arrange
    const ctx = getMockContext();
    const mockUser = getMockUser(randomNumber);
    mockUser.email = "sashank@email.con";
    let hasError = false;

    // Act
    try {
      await authRouter.createCaller(ctx).signup(mockUser);
    } catch {
      hasError = true;
    }

    // Assert
    assert.equal(hasError, true);
  });

  it("Sign Up Fail Invalid SSN", async () => {
    // Arrange
    const ctx = getMockContext();
    const mockUser = getMockUser(randomNumber);
    mockUser.ssn = "12121";
    let hasError = false;

    // Act
    try {
      await authRouter.createCaller(ctx).signup(mockUser);
    } catch {
      hasError = true;
    }

    // Assert
    assert.equal(hasError, true);
  });

  it("Login", async () => {
    // Arrange
    const ctx = getMockContext();
    const mockUser = getMockUser(randomNumber);

    // Act
    const response = await authRouter.createCaller(ctx).login(mockUser);

    // Assert
    assert.notEqual(response.token, undefined);
  });
});
