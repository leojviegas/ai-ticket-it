import { Usuario } from "../../src/domain/entities/usuario.js";
import { CambioEstadoCompra } from "../../src/domain/entities/cambioEstadoCompra.js";
import { EstadoCompra } from "../../src/domain/enums/estadoCompra.js";
import { DomainValidationError } from "../../src/domain/errors/DomainError.js";
import { resetContadoresId } from "../../src/domain/utils/idGenerator.js";

describe("CambioEstadoCompra", () => {
  let usuario;
  let compraDummy;

  beforeEach(() => {
    resetContadoresId();
    usuario = new Usuario({ nombre: "Sofía", apellido: "Martínez" });
    compraDummy = { id: 10 };
  });

  test("crea un cambio de estado válido y lo serializa", () => {
    resetContadoresId();
    const cambio = new CambioEstadoCompra({
      compra: compraDummy,
      estado: EstadoCompra.PENDIENTE,
      quien: usuario,
    });

    expect(cambio.id).toBe(1);
    expect(cambio.fechaHora).toBeInstanceOf(Date);
    expect(cambio.toJSON()).toEqual({
      id: 1,
      compraId: 10,
      estado: "PENDIENTE",
      quien: usuario.toJSON(),
      fechaHora: cambio.fechaHora,
    });
  });

  test("lanza DomainValidationError si falta compra, quien o el estado es inválido", () => {
    expect(
      () => new CambioEstadoCompra({ estado: EstadoCompra.PENDIENTE, quien: usuario })
    ).toThrow("La compra y el usuario son obligatorios en el cambio de estado");

    expect(
      () => new CambioEstadoCompra({ compra: compraDummy, estado: EstadoCompra.PENDIENTE })
    ).toThrow("La compra y el usuario son obligatorios en el cambio de estado");

    expect(
      () =>
        new CambioEstadoCompra({
          compra: compraDummy,
          estado: "ESTADO_INEXISTENTE",
          quien: usuario,
        })
    ).toThrow("Estado de compra inválido: ESTADO_INEXISTENTE");

    expect(() => new CambioEstadoCompra()).toThrow(DomainValidationError);
  });
});

