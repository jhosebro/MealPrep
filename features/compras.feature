# language: es
Característica: Lista de compras y presupuesto
  Como usuario
  Quiero ver lo que se me está acabando y controlar cuánto gasto
  Para hacer mercado sin pasarme del presupuesto

  Antecedentes:
    Dado que inicié sesión

  Escenario: La lista contiene solo lo que se acaba
    Dado que tengo "Leche" en estado "Próximo a agotarse"
    Y "Arroz" en estado "Agotado"
    Y "Sal" en estado "Disponible"
    Cuando abro la pestaña "Compras"
    Entonces veo "Leche" y "Arroz"
    Pero no veo "Sal"

  Escenario: Filtrar por categoría
    Dado que la lista tiene "Leche" (lacteos) y "Tomate" (verduras)
    Cuando filtro por "lacteos"
    Entonces solo veo "Leche"

  Escenario: Filtrar por establecimiento personalizado
    Dado que la lista tiene "Pan" del establecimiento "Panadería Juan"
    Cuando veo el filtro "Otro"
    Entonces el contador de "Otro" incluye a "Pan"
    Y al filtrar por "Otro" veo "Pan"

  Escenario: Editar el precio de un artículo
    Dado que la lista tiene "Leche" sin precio
    Cuando le pongo el precio "4500"
    Entonces el total de la lista aumenta en 4500

  Esquema del escenario: Precio inválido
    Cuando intento poner el precio "<precio>"
    Entonces el precio no se guarda

    Ejemplos:
      | precio    |
      | 0         |
      | 100000000 |
      | 12.5      |

  Escenario: Marcar comprado sin presupuesto activo
    Dado que no tengo un presupuesto activo
    Cuando marco "Leche" como comprada
    Entonces "Leche" pasa a "Disponible" con fecha de compra de hoy (hora local)
    Y sale de la lista de compras

  Escenario: Marcar comprado con presupuesto activo
    Dado que tengo un presupuesto activo de 200.000 con 0 gastado
    Y "Leche" cuesta 4.500
    Cuando marco "Leche" como comprada
    Entonces el gasto del presupuesto es 4.500
    Y queda registrada la compra

  Escenario: Deshacer una compra
    Dado que acabo de marcar "Leche" como comprada con presupuesto activo
    Cuando toco "Deshacer"
    Entonces "Leche" vuelve a la lista
    Y el gasto del presupuesto se reduce en 4.500 sin quedar negativo

  Escenario: Crear presupuesto con separador de miles
    Cuando abro "Presupuesto" y escribo "200.000"
    Y lo confirmo
    Entonces el presupuesto activo es de 200000 pesos

  Escenario: Presupuesto inválido
    Cuando abro "Presupuesto" y escribo "abc"
    Y lo confirmo
    Entonces veo "Ingresa un monto válido"

  Escenario: Archivar y restaurar un artículo
    Dado que la lista tiene "Gaseosa"
    Cuando archivo "Gaseosa"
    Entonces no aparece en la lista
    Y aparece en la vista de archivados
    Cuando toco "Restaurar"
    Entonces vuelve a la lista

  Escenario: Finalizar el presupuesto
    Dado que tengo un presupuesto activo
    Cuando toco "Finalizar" y confirmo
    Entonces el presupuesto se cierra con el total gastado

  @manual
  Escenario: Los errores se muestran también en web
    Dado que uso la app en un navegador
    Cuando falla marcar un artículo como comprado
    Entonces veo un aviso "No se pudo marcar como comprado"
