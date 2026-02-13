import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../trpc";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  INVALID_EMAIL_DOMAIN_ENDINGS,
  REGEX_DATE_OF_BIRTH,
  REGEX_PASSWORD_AT_LEAST_ONE_DIGIT,
  REGEX_PASSWORD_AT_LEAST_ONE_LOWERCASE,
  REGEX_PASSWORD_AT_LEAST_ONE_SPECIAL_CHAR,
  REGEX_PASSWORD_AT_LEAST_ONE_UPPERCASE,
  REGEX_PHONE_NUMBER,
  REGEX_SSN,
  REGEX_ZIP_CODE,
  VALID_US_STATES,
} from "@/utils/validation_const";
import { encryptString } from "@/utils/crypt_utils";
import { SSN_KEY } from "@/utils/keys";

export const authRouter = router({
  signup: publicProcedure
    .input(
      z
        .object({
          email: z.string().email(),
          // Could have merged the regex but keeping them separate in case we want to add specific error messages in the future
          password: z
            .string()
            .min(8)
            .regex(REGEX_PASSWORD_AT_LEAST_ONE_DIGIT)
            .regex(REGEX_PASSWORD_AT_LEAST_ONE_UPPERCASE)
            .regex(REGEX_PASSWORD_AT_LEAST_ONE_LOWERCASE)
            .regex(REGEX_PASSWORD_AT_LEAST_ONE_SPECIAL_CHAR),
          firstName: z.string().min(1),
          lastName: z.string().min(1),
          phoneNumber: z.string().regex(REGEX_PHONE_NUMBER),
          dateOfBirth: z.string().regex(REGEX_DATE_OF_BIRTH),
          ssn: z.string().regex(REGEX_SSN),
          address: z.string().min(1),
          city: z.string().min(1),
          state: z
            .string()
            .length(2)
            .toUpperCase()
            .refine((s) => VALID_US_STATES.includes(s)),
          zipCode: z.string().regex(REGEX_ZIP_CODE),
        })
        .refine((data) => {
          const hasInvalidDomainEnding = INVALID_EMAIL_DOMAIN_ENDINGS.map(
            (ending) => {
              if (data.email.endsWith(ending)) {
                return false;
              }
            },
          ).reduce((accumulator, value) => accumulator || value, false);
          return !hasInvalidDomainEnding;
        }),
    )
    .mutation(async ({ input, ctx }) => {
      const existingUser = db
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = LOWER(${input.email})`)
        .get();

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User already exists",
        });
      }

      const dob = new Date(input.dateOfBirth);
      const today = new Date();
      if (dob > today) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Date of birth cannot be in the future",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      // WARNING: The KEY MUST BE FETCHED SEPARATELY FROM A VAULT. I'm including here for easier setup for evaluation.
      const ssnEncrypted = encryptString(input.ssn, SSN_KEY);

      await db.insert(users).values({
        ...input,
        password: hashedPassword,
        ssn: ssnEncrypted,
      });

      // Fetch the created user
      const user = db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .get();

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user",
        });
      }

      // Create session
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || "temporary-secret-for-interview",
        {
          expiresIn: "7d",
        },
      );

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await db.delete(sessions).where(eq(sessions.userId, user.id));

      await db.insert(sessions).values({
        userId: user.id,
        token,
        expiresAt: expiresAt.toISOString(),
      });

      // Set cookie
      if ("setHeader" in ctx.res) {
        ctx.res.setHeader(
          "Set-Cookie",
          `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`,
        );
      } else {
        (ctx.res as Headers).set(
          "Set-Cookie",
          `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`,
        );
      }

      return { user: { ...user, password: undefined }, token };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const user = db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .get();

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const validPassword = await bcrypt.compare(input.password, user.password);

      if (!validPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || "temporary-secret-for-interview",
        {
          expiresIn: "7d",
        },
      );

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await db.delete(sessions).where(eq(sessions.userId, user.id));

      await db.insert(sessions).values({
        userId: user.id,
        token,
        expiresAt: expiresAt.toISOString(),
      });

      if ("setHeader" in ctx.res) {
        ctx.res.setHeader(
          "Set-Cookie",
          `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`,
        );
      } else {
        (ctx.res as Headers).set(
          "Set-Cookie",
          `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`,
        );
      }

      return { user: { ...user, password: undefined }, token };
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    if (ctx.user) {
      // Delete session from database
      let token: string | undefined;
      if ("cookies" in ctx.req) {
        token = (ctx.req as any).cookies.get("session").value;
      } else {
        const cookieHeader =
          ctx.req.headers.get?.("cookie") || (ctx.req.headers as any).cookie;
        token = cookieHeader
          ?.split("; ")
          .find((c: string) => c.startsWith("session="))
          ?.split("=")[1];
      }
      if (token) {
        await db.delete(sessions).where(eq(sessions.token, token));
      }
    }

    if ("setHeader" in ctx.res) {
      ctx.res.setHeader(
        "Set-Cookie",
        `session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
      );
    } else {
      (ctx.res as Headers).set(
        "Set-Cookie",
        `session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
      );
    }

    return {
      success: true,
      message: ctx.user ? "Logged out successfully" : "No active session",
    };
  }),
});
