// Simple Spanish dictionary for MVP.
// Keep UI strings in Spanish; code/comments in English.

export const es = {
  auth: {
    loginTitle: "Iniciar sesión",
    emailLabel: "Correo electrónico",
    passwordLabel: "Contraseña",
    submit: "Entrar",
    hint: "Ingresa tus credenciales para continuar.",
  },
} as const;

export type EsDictionary = typeof es;
