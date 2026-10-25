import { z } from 'zod';

export const accountDeletionSchema = z.object({
  fullName: z.string().trim().min(1, 'Ingresá tu nombre completo.').max(100, 'El nombre admite hasta 100 caracteres.'),
  email: z.string().trim().email('Ingresá un correo electrónico válido.').max(255, 'El correo admite hasta 255 caracteres.'),
  reason: z.string().trim().max(1000, 'El motivo admite hasta 1000 caracteres.'),
  confirmed: z.boolean().refine(Boolean, 'Confirmá que querés solicitar la eliminación.'),
});