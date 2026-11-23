# language: es
Característica: Recetas
  Como usuario
  Quiero guardar recetas y que la app me sugiera cuáles preparar
  Para cocinar con lo que tengo en la nevera

  Antecedentes:
    Dado que inicié sesión

  Escenario: Sugerencias sin recetas guardadas
    Dado que no tengo recetas guardadas
    Cuando toco "Sugerir recetas"
    Entonces veo "Primero necesitas guardar algunas recetas. Toca el botón + para crear una."

  Escenario: Sugerencias según la nevera
    Dado que tengo guardada "Arroz con huevo" con ingredientes "arroz", "huevo" y "sal"
    Y en mi nevera hay "Arroz" y "Huevos" disponibles
    Cuando toco "Sugerir recetas"
    Entonces veo "Arroz con huevo" con "Tienes todo"

  Escenario: Recetas con demasiados faltantes no se sugieren
    Dado que una receta guardada tiene 3 ingredientes que no tengo
    Cuando toco "Sugerir recetas"
    Entonces esa receta no aparece en las sugerencias

  Escenario: Personalizar ingredientes de la sugerencia
    Dado que tengo recetas guardadas e ingredientes en la nevera
    Cuando toco "Personalizar sugerencias"
    Y deselecciono todos los ingredientes
    Y toco "Buscar sugerencias"
    Entonces veo "Selecciona al menos un ingrediente"

  @manual
  Escenario: Filtrar recetas guardadas por tipo de comida
    Dado que tengo una receta de "desayuno" y otra de "cena"
    Cuando estoy en "Guardadas" y elijo "Desayuno"
    Entonces solo veo la receta de desayuno

  @manual
  Escenario: Pedir una receta a la IA
    Cuando toco el botón de IA, elijo "Cena" y toco "Copiar formato y abrir ChatGPT"
    Entonces la plantilla JSON queda en el portapapeles
    Y se abre ChatGPT con un mensaje que incluye mis ingredientes disponibles

  Escenario: Importar una receta en JSON válida
    Dado que estoy en "Crear receta" en modo "Importar JSON"
    Cuando pego un JSON con title, meal_type, ingredients y steps válidos
    Y toco "Validar y Guardar"
    Entonces veo "Receta guardada"
    Y la receta aparece en "Guardadas"

  Esquema del escenario: JSON inválido
    Dado que estoy en "Crear receta" en modo "Importar JSON"
    Cuando pego "<json>" y toco "Validar y Guardar"
    Entonces veo el error "<mensaje>"

    Ejemplos:
      | json                                                    | mensaje                                             |
      | {no es json                                             | El JSON no es válido. Revisa el formato.            |
      | {"meal_type":"cena"}                                    | El campo "title" es requerido y debe ser texto      |
      | {"title":"X","meal_type":"brunch"}                      | "meal_type" debe ser: desayuno, almuerzo, cena, merienda, snack |
      | {"title":"X","meal_type":"cena","ingredients":[]}       | "ingredients" debe ser un array con al menos 1 elemento |

  Escenario: Crear receta manual
    Dado que estoy en "Crear receta" en modo "Manual"
    Cuando escribo el nombre "Arepa", un ingrediente por línea y un paso por línea
    Y toco "Guardar Receta"
    Entonces veo "Receta guardada"

  Escenario: Falla al guardar una receta
    Dado que el servidor no está disponible
    Cuando intento guardar una receta válida
    Entonces veo un error
    Y sigo en "Crear receta" sin perder lo escrito

  Escenario: Marcar una receta como preparada
    Dado que estoy en el detalle de una receta guardada
    Cuando toco "Ya la preparé" y confirmo
    Entonces veo "¡Buen provecho!"
    Y no se me sugiere durante los próximos 7 días

  Escenario: Eliminar una receta guardada
    Dado que estoy en el detalle de una receta guardada
    Cuando toco eliminar y confirmo "¿Estás seguro de eliminar esta receta?"
    Entonces vuelvo a la lista y la receta ya no aparece
