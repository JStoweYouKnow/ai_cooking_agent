import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { getDb } from "../db";
import { logger } from "./logger";
import { verifyAWSCredentials, verifyS3Access, getAllAccessKeys } from "./awsCredentials";

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

      // AWS credentials check (if configured)
      if (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ROLE_ARN) {
        try {
          const awsStart = Date.now();
          const awsCheck = await verifyAWSCredentials();
          const awsLatency = Date.now() - awsStart;
          
          if (awsCheck.valid) {
            checks.aws = {
              status: 'ok',
              message: `User: ${awsCheck.userName || 'N/A'}`,
              latency: awsLatency,
            };
          } else {
            checks.aws = {
              status: 'error',
              message: awsCheck.error || 'AWS credentials invalid',
              latency: awsLatency,
            };
            overallStatus = overallStatus === 'ok' ? 'degraded' : 'error';
          }
        } catch (error: any) {
          checks.aws = {
            status: 'error',
            message: error.message || 'AWS credential check failed',
          };
          overallStatus = overallStatus === 'ok' ? 'degraded' : 'error';
        }
      }

      // S3 access check (if any S3 bucket is configured)
      if (process.env.S3_BUCKET || process.env.S3_BUCKET_INGREDIENTS || process.env.S3_BUCKET_RECIPE_IMAGES) {
        try {
          const s3Start = Date.now();
          const s3Check = await verifyS3Access();
          const s3Latency = Date.now() - s3Start;
          
          if (s3Check.valid) {
            checks.s3 = {
              status: 'ok',
              message: `Accessible (${s3Check.bucketCount || 0} buckets)`,
              latency: s3Latency,
            };
          } else {
            checks.s3 = {
              status: 'error',
              message: s3Check.error || 'S3 access denied',
              latency: s3Latency,
            };
            overallStatus = overallStatus === 'ok' ? 'degraded' : 'error';
          }
        } catch (error: any) {
          checks.s3 = {
            status: 'error',
            message: error.message || 'S3 access check failed',
          };
          overallStatus = overallStatus === 'ok' ? 'degraded' : 'error';
        }
      }

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        checks,
      };
    }),

  listAccessKeys: adminProcedure
    .input(
      z.object({
        userName: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      try {
        const keys = await getAllAccessKeys(input?.userName);
        return {
          success: true,
          keys: keys.map(key => ({
            accessKeyId: key.AccessKeyId,
            status: key.Status,
            createDate: key.CreateDate.toISOString(),
          })),
        };
      } catch (error: any) {
        logger.error("Failed to list access keys", { error: error.message });
        throw new Error(`Failed to list access keys: ${error.message || "Unknown error"}`);
      }
    }),

  verifyAWSCredentials: adminProcedure
    .query(async () => {
      try {
        const credentialCheck = await verifyAWSCredentials();
        const s3Check = await verifyS3Access();
        
        return {
          credentials: credentialCheck,
          s3: s3Check,
        };
      } catch (error: any) {
        logger.error("Failed to verify AWS credentials", { error: error.message });
        throw new Error(`Failed to verify AWS credentials: ${error.message || "Unknown error"}`);
      }
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
