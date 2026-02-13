import { memDb } from "@/test/init_test_db.test";
import { accounts, users } from "@/lib/db/schema";

export function getMockContext() {
  return {
    req: {},
    res: {
      setHeader: () => {},
      set: () => {},
    },
    user: null,
  };
}

export function getUserAuthContext(user: {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  ssn: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  createdAt: string | null;
}) {
  return {
    req: {},
    res: {
      setHeader: () => {},
      set: () => {},
    },
    user: user,
  };
}

export function getMockUser(randomNumber: number) {
  return {
    email: `shreyas${randomNumber}@gmail.com`,
    password: "Shreyas123,",
    address: "123 Main St",
    phoneNumber: "1234567890",
    ssn: "123456789",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    firstName: "Shreyas",
    lastName: "V",
    dateOfBirth: "2026-01-01",
    id: "1",
    createdAt: "",
  };
}

export function getMockAccount() {
  return {
    accountType: "savings" as const,
  };
}

export async function prepareUserForTest(randomNumber: number) {
  const [user] = await memDb
    .insert(users)
    .values({
      email: `shreyas${randomNumber}@gmail.com`,
      password: "Shreyas123,",
      address: "123 Main St",
      phoneNumber: "1234567890",
      ssn: "123456789",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      firstName: "Shreyas",
      lastName: "V",
      dateOfBirth: "1990-01-01",
      createdAt: "",
    })
    .returning();
  return user;
}

export async function prepareAccountForTest(
  userId: number,
  accountNumber: string,
) {
  const [account] = await memDb
    .insert(accounts)
    .values({
      userId,
      accountNumber: accountNumber,
      accountType: "savings",
      balance: 0,
      status: "active",
    })
    .returning();
  return account;
}

export function getMockTransaction(
  accountId: number,
  accountNumber: string,
  depositAmount: number,
  fundingSourceType: "bank" | "card" = "bank",
) {
  return {
    accountId: accountId,
    amount: depositAmount,
    fundingSource: {
      accountNumber: accountNumber,
      type: fundingSourceType,
      routingNumber: fundingSourceType === "bank" ? "111000025" : undefined,
    },
  };
}
