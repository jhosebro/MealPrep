const AUTH_ERRORS: Record<string, string> = {
  'Email not confirmed': 'Confirma tu correo antes de iniciar sesión.',
  'Invalid login credentials': 'Correo o contraseña incorrectos.',
  'User already registered': 'Ya existe una cuenta con ese correo.',
};

export const translateAuthError = (message: string) => AUTH_ERRORS[message] ?? message;

export const loginFormError = (email: string, password: string) =>
  !email || !password ? 'Por favor completa todos los campos' : null;
