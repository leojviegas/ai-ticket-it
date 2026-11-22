# Diagrama de Clases del Dominio (`AI Ticket It`)

Este documento es la referencia estructurada y legible por agentes de IA del **Diagrama Tentativo** oficial del enunciado. La imagen original también se encuentra respaldada en `docs/diagrama-tentativo-original.png`.

---

## 1. Réplica Exacta del Diagrama Tentativo (Mermaid)

```mermaid
classDiagram
    direction TB

    class CambioEstadoCompra {
        -compra: Compra
        -estado: EstadoCompra
        -quien: Usuario
        -fechaHora: DateTime
    }

    class Compra {
        -comprador: Usuario
        -evento: Evento
        -tipoEntrada: TipoEntrada
        -cantidad: Int
        -total: Double
        -estado: EstadoCompra
        -mensajes: Mensaje[]
        +actualizarEstado(EstadoCompra) void
    }

    class EstadoCompra {
        <<enumeration>>
        PENDIENTE
        CONFIRMADA
        UTILIZADA
        CANCELADA
        REEMBOLSADA
    }

    class Resenia {
        -comprador: Usuario
        -evento: Evento
        -detalle: String
        -puntuacion: Double
    }

    class Mensaje {
        -usuario: Usuario
        -mensaje: String
        -enviado: DateTime
    }

    class Usuario {
        -nombre: String
        -apellido: String
        -favoritos: Evento[]
    }

    class Evento {
        -nombre: String
        -descripcion: String
        -categoria: Categoria
        -fecha: DateTime
        -tiposEntrada: TipoEntrada[]
        -multimedia: String[]
        -organizador: Usuario
        +tuPrecioEstaEntre(Int, Int) Boolean
    }

    class Categoria {
        -nombre: String
        -descripcion: String
    }

    class TipoEntrada {
        -nombre: String
        -descripcion: String
        -precio: Double
        -cupo: Int
        +hayCupoPara(Int) Boolean
    }

    %% Relaciones exactas del diagrama
    CambioEstadoCompra --> Compra
    CambioEstadoCompra --> EstadoCompra
    CambioEstadoCompra --> Usuario

    Compra --> Usuario
    Compra --> Evento
    Compra --> TipoEntrada
    Compra --> EstadoCompra
    Compra --> "*" Mensaje

    Mensaje --> Usuario

    Resenia --> Usuario
    Resenia --> Evento

    Usuario --> "*" Evento : favoritos
    Evento --> Usuario : organizador
    Evento --> Categoria
    Evento --> "*" TipoEntrada
```

---

## 2. Diccionario Detallado de Clases, Atributos y Métodos

| Clase / Enum | Tipo | Atributos (del Diagrama) | Métodos (del Diagrama) | Relaciones Salientes |
| :--- | :--- | :--- | :--- | :--- |
| **`Usuario`** | Clase (`C`) | `- nombre: String`<br>`- apellido: String`<br>`- favoritos: Evento[]` | *(Métodos de gestión de favoritos en implementación)* | `--> "*" Evento` (`favoritos`) |
| **`Categoria`** | Clase (`C`) | `- nombre: String`<br>`- descripcion: String` | — | — |
| **`TipoEntrada`** | Clase (`C`) | `- nombre: String`<br>`- descripcion: String`<br>`- precio: Double`<br>`- cupo: Int` | `+ hayCupoPara(Int): Boolean` | — |
| **`Evento`** | Clase (`C`) | `- nombre: String`<br>`- descripcion: String`<br>`- categoria: Categoria`<br>`- fecha: DateTime`<br>`- tiposEntrada: TipoEntrada[]`<br>`- multimedia: String[]`<br>`- organizador: Usuario` | `+ tuPrecioEstaEntre(Int, Int): Boolean` | `--> Usuario` (`organizador`)<br>`--> Categoria`<br>`--> "*" TipoEntrada` |
| **`Compra`** | Clase (`C`) | `- comprador: Usuario`<br>`- evento: Evento`<br>`- tipoEntrada: TipoEntrada`<br>`- cantidad: Int`<br>`- total: Double`<br>`- estado: EstadoCompra`<br>`- mensajes: Mensaje[]` | `+ actualizarEstado(EstadoCompra): void` | `--> Usuario` (`comprador`)<br>`--> Evento`<br>`--> TipoEntrada`<br>`--> EstadoCompra`<br>`--> "*" Mensaje` |
| **`EstadoCompra`** | Enum (`E`) | `PENDIENTE`<br>`CONFIRMADA`<br>`UTILIZADA`<br>`CANCELADA`<br>`REEMBOLSADA` | — | — |
| **`CambioEstadoCompra`** | Clase (`C`) | `- compra: Compra`<br>`- estado: EstadoCompra`<br>`- quien: Usuario`<br>`- fechaHora: DateTime` | — | `--> Compra`<br>`--> EstadoCompra`<br>`--> Usuario` (`quien`) |
| **`Mensaje`** | Clase (`C`) | `- usuario: Usuario`<br>`- mensaje: String`<br>`- enviado: DateTime` | — | `--> Usuario` |
| **`Resenia`** | Clase (`C`) | `- comprador: Usuario`<br>`- evento: Evento`<br>`- detalle: String`<br>`- puntuacion: Double` | — | `--> Usuario` (`comprador`)<br>`--> Evento` |

