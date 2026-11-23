# language: es
Característica: Inicio y cuenta
  Como usuario
  Quiero un resumen de mi nevera y controlar mis datos
  Para decidir rápido qué hacer y proteger mi privacidad

  Antecedentes:
    Dado que inicié sesión

  Escenario: Resumen de la nevera
    Dado que tengo 3 alimentos en la nevera
    Cuando abro la pestaña "Inicio"
    Entonces veo "3 ingredientes en tu nevera"

  Escenario: Alimentos próximos a agotarse
    Dado que "Leche" está "Próximo a agotarse"
    Y "Arroz" tiene promedio de 1 día por unidad y cantidad 2
    Cuando abro la pestaña "Inicio"
    Entonces veo "Leche" con "Próximo a agotarse"
    Y veo "Arroz" con "~2 días"

  Escenario: Sugerir recetas desde el inicio
    Dado que tengo alimentos disponibles y recetas guardadas
    Cuando toco "Sugerir recetas con mi nevera"
    Entonces voy a la pestaña "Recetas" con sugerencias calculadas

  @manual
  Escenario: Activar huella sin hardware disponible
    Dado que mi dispositivo no tiene huella configurada
    Cuando activo "Desbloqueo con huella" en Configuración
    Entonces veo "Tu dispositivo no tiene huella configurada."
    Y el interruptor sigue apagado

  @manual
  Escenario: Exportar mis datos
    Cuando toco "Exportar mis datos" en Configuración
    Entonces todos mis datos quedan en el portapapeles en JSON
    Y veo "Datos exportados"

  @manual
  Escenario: Eliminar mi cuenta
    Cuando toco "Eliminar cuenta" en Configuración
    Y confirmo "Eliminar"
    Entonces mi cuenta y mis datos se borran
    Y el desbloqueo con huella se desactiva
    Y veo la pantalla de inicio de sesión

  @manual
  Escenario: Cancelar la eliminación de la cuenta
    Cuando toco "Eliminar cuenta" en Configuración
    Y cancelo la confirmación
    Entonces mi cuenta sigue activa

  Escenario: La nevera se guarda en caché y se borra al cerrar sesión
    Dado que tengo "Leche" en la nevera
    Entonces la caché local guarda "Leche"
    Cuando cierro sesión
    Entonces la caché local está vacía
    Y la nevera en pantalla está vacía
