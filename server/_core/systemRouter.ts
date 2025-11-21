import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { getDb } from "../db";
import { logger } from "./logger";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative").optional(),
      }).optional()
    )
    .query(async () => {
      const checks: Record<string, { status: 'ok' | 'error'; message?: string; latency?: number }> = {};
      let overallStatus: 'ok' | 'degraded' | 'error' = 'ok';

      // Database connectivity check
      try {
        const dbStart = Date.now();
        const db = await getDb();
        const dbLatency = Date.now() - dbStart;
        
        if (!db) {
          checks.database = {
            status: 'error',
            message: 'Database connection not available',
          };
          overallStatus = 'error';
        } else {
          // Try a simple query
          try {
            await db.execute('SELECT 1');
            checks.database = {
              status: 'ok',
              latency: dbLatency,
            };
          } catch (error: any) {
            checks.database = {
              status: 'error',
              message: error.message || 'Database query failed',
              latency: dbLatency,
            };
            overallStatus = overallStatus === 'ok' ? 'degraded' : 'error';
          }
        }
      } catch (error: any) {
        checks.database = {
          status: 'error',
          message: error.message || 'Database connection failed',
        };
        overallStatus = 'error';
      }

      // Environment variables check
      const requiredEnvVars = ['DATABASE_URL'];
      const missingEnvVars: string[] = [];
      requiredEnvVars.forEach((varName) => {
        if (!process.env[varName]) {
          missingEnvVars.push(varName);
        }
      });

      if (missingEnvVars.length > 0) {
        checks.environment = {
          status: 'error',
          message: `Missing required environment variables: ${missingEnvVars.join(', ')}`,
        };
        overallStatus = 'error';
      } else {
        checks.environment = {
          status: 'ok',
        };
      }

      // Memory usage check
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      };
      checks.memory = {
        status: 'ok',
        message: `RSS: ${memoryUsageMB.rss}MB, Heap: ${memoryUsageMB.heapUsed}/${memoryUsageMB.heapTotal}MB`,
      };

      // Uptime
      checks.uptime = {
        status: 'ok',
        message: `${Math.round(process.uptime())} seconds`,
      };

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        checks,
      };
    }),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
