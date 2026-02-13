import { router } from "../trpc";
import { authRouter } from "./auth";
import {accountRouterFactory} from "./account";

export const appRouter = router({
  auth: authRouter,
  account: accountRouterFactory(),
});

export type AppRouter = typeof appRouter;
