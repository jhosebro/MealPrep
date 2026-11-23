# language: es
Característica: Autenticación
  Como usuario de MealPrep
  Quiero entrar a la app de forma segura
  Para gestionar mi nevera, compras y recetas

  @manual
  Escenario: Inicio de sesión con correo y contraseña válidos
    Dado que estoy en la pantalla de inicio de sesión
    Cuando ingreso el correo "ana@example.com" y una contraseña válida
    Y toco "Iniciar sesión"
    Entonces veo la pantalla de inicio

  Escenario: Campos vacíos
    Dado que estoy en la pantalla de inicio de sesión
    Cuando toco "Iniciar sesión" sin completar correo o contraseña
    Entonces veo el error "Por favor completa todos los campos"

  Esquema del escenario: Errores de autenticación traducidos
    Dado que estoy en la pantalla de inicio de sesión
    Cuando el servidor responde con el error "<error_servidor>"
    Entonces veo el error "<mensaje>"

    Ejemplos:
      | error_servidor            | mensaje                                   |
      | Invalid login credentials | Correo o contraseña incorrectos.          |
      | Email not confirmed       | Confirma tu correo antes de iniciar sesión. |
      | User already registered   | Ya existe una cuenta con ese correo.      |

  @manual
  Escenario: Registro que requiere confirmar el correo
    Dado que estoy en la pantalla de inicio de sesión
    Cuando toco "Regístrate"
    Y ingreso un correo y una contraseña nuevos
    Y toco "Registrarse"
    Entonces veo el aviso "Te enviamos un correo. Confirma tu cuenta y luego inicia sesión."
    Y el formulario vuelve al modo "Inicia sesión"

  @manual
  Escenario: Alternar entre registro e inicio de sesión limpia el error
    Dado que veo un mensaje de error en el formulario
    Cuando toco "¿No tienes cuenta? Regístrate"
    Entonces el mensaje de error desaparece
    Y el título dice "Crea una cuenta"

  @manual
  Escenario: Inicio de sesión con Google fallido
    Dado que estoy en la pantalla de inicio de sesión
    Cuando toco "Continuar con Google" y no hay conexión
    Entonces veo el error "Error de conexión con Google."

  @manual
  Escenario: Ofrecer huella tras el primer inicio de sesión (móvil)
    Dado que mi dispositivo tiene huella configurada
    Y no he activado el desbloqueo con huella
    Cuando inicio sesión con correo y contraseña
    Entonces se me pregunta "¿Quieres usar tu huella?"
    Y si respondo "Sí" el desbloqueo con huella queda activado

  @manual
  Escenario: Restaurar sesión al abrir la app
    Dado que tengo una sesión guardada
    Y el desbloqueo con huella está desactivado
    Cuando abro la app
    Entonces entro directamente a la pantalla de inicio

  @manual
  Escenario: Sin sesión guardada
    Dado que no tengo una sesión guardada
    Cuando abro la app
    Entonces veo la pantalla de inicio de sesión

  @manual
  Escenario: Desbloqueo con huella al abrir la app
    Dado que tengo una sesión guardada
    Y el desbloqueo con huella está activado y disponible
    Cuando abro la app y la huella es reconocida
    Entonces entro a la pantalla de inicio

  @manual
  Escenario: Huella no reconocida al abrir la app
    Dado que tengo una sesión guardada
    Y el desbloqueo con huella está activado y disponible
    Cuando abro la app y la huella falla
    Entonces veo "No pudimos autenticarte con tu huella"
    Y puedo tocar "Intentar de nuevo"
    Y si toco "Usar contraseña" se cierra la sesión y veo el inicio de sesión

  @manual
  Escenario: Cerrar sesión
    Dado que inicié sesión
    Cuando abro "Configuración" y toco "Cerrar sesión"
    Y confirmo "¿Estás seguro de cerrar sesión?"
    Entonces veo la pantalla de inicio de sesión
