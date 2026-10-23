import { z } from 'zod';

export const accessSchema = z.object({
  email: z.string().trim().email('Ingresá un correo electrónico válido.').max(255),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.').max(128),
});
export const registrationSchema = accessSchema.extend({
  fullName: z.string().trim().min(1, 'Ingresá tu nombre completo.').max(100, 'El nombre debe tener como máximo 100 caracteres.'),
});