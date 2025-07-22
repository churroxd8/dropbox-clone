import * as z from "zod";

export const signUpSchema = z.
    object({
        email: z
            .string()
            .min(1, {message: "Email is required"})
            .email({message: "Please enter a valid email"}),
        password: z
            .string()
            .min(1, {message: "Password is required"})
            .min(8, {message: "Password should be at least 8 characters"}),
        passwordConfirmation: z
            .string()
            .min(1, {message: "Please confirm your password"}),
    })
    .refine((data) => data.password === data.passwordConfirmation, {
        message: "Password does not match",
        path: ["passwordConfirmation"],
    });