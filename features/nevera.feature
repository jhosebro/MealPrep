# language: es
Característica: Gestión de la nevera
  Como usuario
  Quiero registrar los alimentos que tengo
  Para saber qué me queda y qué debo comprar

  Antecedentes:
    Dado que inicié sesión

  Escenario: Ver la nevera agrupada por categoría
    Dado que tengo "Leche" en "lacteos" y "Tomate" en "verduras"
    Cuando abro la pestaña "Nevera"
    Entonces veo una sección por cada categoría con sus alimentos

  Escenario: Buscar un alimento
    Dado que tengo "Leche" y "Tomate" en la nevera
    Cuando escribo "lec" en el buscador
    Entonces solo veo "Leche"

  Escenario: Agregar un alimento válido
    Dado que estoy en "Agregar alimento"
    Cuando escribo el nombre "Huevos"
    Y la cantidad "12" con unidad "und"
    Y elijo la categoría "otros" y el establecimiento "D1"
    Y toco "Guardar"
    Entonces vuelvo a la nevera y veo "Huevos" con 12 und

  Escenario: El nombre es obligatorio
    Dado que estoy en "Agregar alimento"
    Cuando dejo el nombre vacío y toco "Guardar"
    Entonces veo el error "El nombre es requerido"

  Esquema del escenario: La cantidad debe ser un entero mayor o igual a 0
    Dado que estoy en "Agregar alimento"
    Cuando escribo el nombre "Arroz" y la cantidad "<cantidad>"
    Y toco "Guardar"
    Entonces veo el error "La cantidad debe ser un número entero (0 o más)"

    Ejemplos:
      | cantidad |
      | -1       |
      | 1.5      |
      | abc      |
      |          |

  Escenario: Cantidad 0 marca el alimento como agotado
    Dado que estoy en "Agregar alimento"
    Cuando escribo el nombre "Sal", la cantidad "0" y el estado "Disponible"
    Y toco "Guardar"
    Entonces "Sal" se guarda con estado "Agotado"

  Escenario: Precio por unidad se guarda como total de la línea
    Dado que estoy en "Agregar alimento"
    Cuando escribo el nombre "Huevos"
    Y escribo la cantidad "3" y un precio por unidad de "2000"
    Y toco "Guardar"
    Entonces el alimento se guarda con precio 6000

  Escenario: Establecimiento personalizado
    Dado que estoy en "Agregar alimento"
    Cuando escribo el nombre "Pan"
    Y elijo el establecimiento "Otro" y escribo "Tienda de la esquina"
    Y guardo el alimento
    Entonces el alimento queda con establecimiento "Tienda de la esquina"

  Escenario: Las fechas se guardan en la fecha local elegida
    Dado que estoy en "Agregar alimento" a las 21:00 hora de Colombia
    Cuando escribo el nombre "Leche"
    Y dejo la fecha de compra en hoy y guardo
    Entonces la fecha de compra guardada es la de hoy, no la de mañana

  @manual
  Escenario: Escanear un código de barras conocido
    Dado que estoy en "Agregar alimento"
    Cuando toco "Escanear código de barras" y leo un código que existe en Open Food Facts
    Entonces vuelvo a "Agregar alimento" con nombre y categoría prellenados
    Y veo "Escaneado · empaque de" con el tamaño del empaque

  @manual
  Escenario: Código de barras desconocido
    Dado que estoy escaneando
    Cuando escribo manualmente el código "7700000000000" y toco "Buscar"
    Y el código no existe
    Entonces veo "No encontramos el código 7700000000000. Puedes agregarlo a mano."

  @manual
  Escenario: Sin permiso de cámara
    Dado que negué el permiso de cámara de forma permanente
    Cuando abro el escáner
    Entonces veo "Activa el permiso de cámara en los ajustes del dispositivo."

  Escenario: Editar un alimento conserva sus fechas
    Dado que tengo "Leche" con fecha de compra "2026-11-20" y vencimiento "2026-11-30"
    Cuando abro "Leche", cambio la cantidad a 2 y guardo
    Entonces las fechas siguen siendo "2026-11-20" y "2026-11-30"

  Escenario: Agotar un alimento calcula el consumo promedio
    Dado que tengo 4 und de "Huevos" compradas hace 8 días
    Cuando edito "Huevos", pongo la cantidad en 0 y guardo
    Entonces "Huevos" queda "Agotado"
    Y su consumo total aumenta en 4
    Y su promedio es de 2 días por unidad

  Escenario: Guardar de nuevo un alimento ya agotado no recalcula el consumo
    Dado que "Huevos" ya está "Agotado" con consumo total 4
    Cuando lo edito y guardo sin cambios
    Entonces su consumo total sigue siendo 4

  Escenario: Estimación de días restantes
    Dado que "Arroz" tiene promedio de 2 días por unidad y cantidad 3
    Cuando veo la nevera
    Entonces "Arroz" muestra "~6 días"

  Escenario: Eliminar un alimento
    Dado que tengo "Tomate" en la nevera
    Cuando lo elimino y confirmo
    Entonces "Tomate" ya no aparece en la nevera

  Escenario: Falla al eliminar un alimento
    Dado que estoy editando "Tomate"
    Y el servidor no está disponible
    Cuando toco eliminar y confirmo
    Entonces veo un mensaje de error
    Y sigo en la pantalla de edición

  Escenario: Exportar la nevera
    Dado que tengo alimentos en la nevera
    Cuando toco exportar
    Entonces se comparte o copia un JSON con mis alimentos

  Escenario: Exportar sin alimentos
    Dado que mi nevera está vacía
    Cuando toco exportar
    Entonces veo "No hay alimentos para exportar"
