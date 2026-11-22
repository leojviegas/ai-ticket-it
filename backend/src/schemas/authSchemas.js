import { z } from "zod";

export const registerSchema = z.object({
  nombre: z.string({ error: "El nombre es obligatorio" }).trim().min(1, "El nombre es obligatorio"),
  apellido: z
    .string({ error: "El apellido es obligatorio" })
    .trim()
    .min(1, "El apellido es obligatorio"),
  email: z
    .string({ error: "El email es obligatorio" })
    .trim()
    .min(1, "El email es obligatorio")
    .email("El formato del email es inválido"),
  password: z
    .string({ error: "La contraseña debe tener al menos 6 caracteres" })
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const loginSchema = z.object({
  email: z
    .string({ error: "El email y la contraseña son obligatorios" })
    .trim()
    .min(1, "El email y la contraseña son obligatorios"),
  password: z
    .string({ error: "El email y la contraseña son obligatorios" })
    .trim()
    .min(1, "El email y la contraseña son obligatorios"),
});
