import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { db } from "@/lib/db";
import { accounts, transactions } from "@/lib/db/schema";
import {eq, and, desc} from "drizzle-orm";
import * as crypto from "node:crypto";
import checkCreditCardValid, {getAccountNumberChecksum} from "@/utils/account_number_luhn";

function generateAccountNumber(): string {
    const digits = Array.from(crypto.getRandomValues(new Uint32Array(9))).map(digit => digit % 10);
    const luhnChecksum = getAccountNumberChecksum(digits.join(""));
    digits.push(luhnChecksum);
    return digits.join("");
}

export const accountRouter = router({
  createAccount: protectedProcedure
    .input(
      z.object({
        accountType: z.enum(["checking", "savings"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user already has an account of this type
      const existingAccount = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.userId, ctx.user.id), eq(accounts.accountType, input.accountType)))
        .get();

      if (existingAccount) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `You already have a ${input.accountType} account`,
        });
      }

      let accountNumber;
      let isUnique = false;

      // Generate unique account number
      while (!isUnique) {
        accountNumber = generateAccountNumber();
        const existing = await db.select().from(accounts).where(eq(accounts.accountNumber, accountNumber)).get();
        isUnique = !existing;
      }

      await db.insert(accounts).values({
        userId: ctx.user.id,
        accountNumber: accountNumber!,
        accountType: input.accountType,
        balance: 0,
        status: "active",
      });

      // Fetch the created account
      const account = await db.select().from(accounts).where(eq(accounts.accountNumber, accountNumber!)).get();

      if (!account) {
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create account",
        });
      }

      return (
        account
      );
    }),

  getAccounts: protectedProcedure.query(async ({ ctx }) => {
    const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, ctx.user.id));

    return userAccounts;
  }),

  fundAccount: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        amount: z.number().positive().max(10000),
        fundingSource: z.object({
          type: z.enum(["card", "bank"]),
          accountNumber: z.string(),
          routingNumber: z.string().optional(),
        }),
      }).refine((data) => {
        if (data.fundingSource.type === "bank") {
            const bankAccountNumberRegex = /^\d+$/;
            return !!data.fundingSource.routingNumber && bankAccountNumberRegex.test(data.fundingSource.accountNumber);
        } else {
            const cardAccountNumberRegex = /^\d{16}$/;
            return cardAccountNumberRegex.test(data.fundingSource.accountNumber) && checkCreditCardValid(data.fundingSource.accountNumber);
        }
      })
    )
    .mutation(async ({ input, ctx }) => {
      const amount = parseFloat(input.amount.toString());

        // Verify account belongs to user
        const account = await db
            .select()
            .from(accounts)
            .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, ctx.user.id)))
            .get();

        if (!account) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Account not found",
            });
        }

        if (account.status !== "active") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Account is not active",
            });
        }

        return db.transaction((tx) => {
            // Create transaction entry
            tx.insert(transactions).values({
                accountId: input.accountId,
                type: "deposit",
                amount,
                description: `Funding from ${input.fundingSource.type}`,
                status: "completed",
                processedAt: new Date().toISOString(),
            }).run();

            // Update account balance
            tx
                .update(accounts)
                .set({
                    balance: account.balance + amount,
                })
                .where(eq(accounts.id, input.accountId)).run();

            // Fetch the created transaction and latest amount
            const transaction = tx.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(1).get();
            const balance = tx.select({balance: accounts.balance}).from(accounts).where(eq(accounts.id, input.accountId)).get();

            return {
                transaction,
                newBalance: balance,
            };
        }, {
            behavior: 'immediate'
        });
    }),

  getTransactions: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify account belongs to user
      const account = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, ctx.user.id)))
        .get();

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found",
        });
      }

      const accountTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.accountId, input.accountId))
        .orderBy(desc(transactions.createdAt));

      const enrichedTransactions = [];
      for (const transaction of accountTransactions) {
        const accountDetails = await db.select().from(accounts).where(eq(accounts.id, transaction.accountId)).get();

        enrichedTransactions.push({
          ...transaction,
          accountType: accountDetails?.accountType,
        });
      }

      return enrichedTransactions;
    }),
});
