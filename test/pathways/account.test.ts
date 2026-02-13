import { describe, it } from "node:test";
import {
  getMockAccount,
  getMockTransaction,
  getUserAuthContext,
  prepareAccountForTest,
  prepareUserForTest,
} from "@/test/test_util/test_util";
import assert from "node:assert";
import { memDb } from "@/test/init_test_db.test";
import { accountRouterFactory } from "@/server/routers/account";

describe("User Bank Account Tests /account", async () => {
  it("Create Account", async () => {
    // Arrange
    const user = await prepareUserForTest(0);
    const ctx = getUserAuthContext(user);
    const mockAccount = getMockAccount();
    const accountRouter = accountRouterFactory(memDb);

    // Act
    const response = await accountRouter
      .createCaller(ctx)
      .createAccount(mockAccount);

    // Assert
    assert.equal(mockAccount.accountType, response.accountType);
    assert.match(response.accountNumber, /^\d{10}$/);
    assert.equal(response.balance, 0);
  });

  it("Create Account and add transaction - Fund source Bank Account", async () => {
    // Arrange
    const user = await prepareUserForTest(1);
    const ctx = getUserAuthContext(user);
    const accountRouter = accountRouterFactory(memDb);
    const account = await prepareAccountForTest(user.id, "1234567890");
    const depositAmount = 100;
    const mockTransaction = getMockTransaction(
      account.id,
      "1203304331",
      depositAmount,
    );

    // Act
    const response = await accountRouter
      .createCaller(ctx)
      .fundAccount(mockTransaction);

    // Assert
    assert.equal(response.newBalance?.balance, account.balance + depositAmount);
  });

  it("Create the same account type multiple times", async () => {
    // Arrange
    const user = await prepareUserForTest(2);
    const ctx = getUserAuthContext(user);
    const mockAccount = getMockAccount();
    const accountRouter = accountRouterFactory(memDb);
    let hasError = false;
    // Act
    await accountRouter.createCaller(ctx).createAccount(mockAccount);
    try {
      await accountRouter.createCaller(ctx).createAccount(mockAccount);
    } catch {
      hasError = true;
    }

    // Assert
    assert.equal(hasError, true);
  });

  it("Create Account and add transaction Invalid card number", async () => {
    // Arrange
    const user = await prepareUserForTest(3);
    const ctx = getUserAuthContext(user);
    const accountRouter = accountRouterFactory(memDb);
    const account = await prepareAccountForTest(user.id, "1234567891");
    const depositAmount = 100;
    const mockTransaction = getMockTransaction(
      account.id,
      "1203304331",
      depositAmount,
      "card",
    );

    let hasError = false;
    // Act
    try {
      await accountRouter.createCaller(ctx).fundAccount(mockTransaction);
    } catch {
      hasError = true;
    }

    // Assert
    assert.equal(hasError, true);
  });

  it("Create Account and add transaction valid card input", async () => {
    // Arrange
    const user = await prepareUserForTest(4);
    const ctx = getUserAuthContext(user);
    const accountRouter = accountRouterFactory(memDb);
    const account = await prepareAccountForTest(user.id, "1234567892");
    const depositAmount = 100;
    const mockTransaction = getMockTransaction(
      account.id,
      "5212677486306168",
      depositAmount,
      "card",
    );

    // Act
    const response = await accountRouter
      .createCaller(ctx)
      .fundAccount(mockTransaction);

    // Assert
    assert.equal(response.newBalance?.balance, account.balance + depositAmount);
  });
});
