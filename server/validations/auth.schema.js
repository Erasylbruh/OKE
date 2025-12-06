import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        username: z.string().min(6).regex(/^(?=.*[a-z])(?=.*\d)[a-z0-9]+$/, "Username must contain letters and numbers"),
        password: z.string().min(8).regex(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@#$%&]).*$/, "Password must contain letters, numbers and special char")
    })
});

export const loginSchema = z.object({
    body: z.object({
        username: z.string(),
        password: z.string()
    })
});
