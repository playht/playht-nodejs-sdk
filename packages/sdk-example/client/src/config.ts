import { z } from 'zod';

const EnvVars = z
  .object({
    VITE_BACKEND_HOST_URL: z.string().optional(),
  })
  .optional();

const ENV_VARS = EnvVars.parse(import.meta.env);

export const CONFIG = {
  BACKEND_HOST_URL: ENV_VARS?.VITE_BACKEND_HOST_URL || 'http://localhost:3000',
};
