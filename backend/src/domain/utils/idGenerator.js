let contador = 0;

export function generarId() {
  contador += 1;
  return contador;
}

export function establecerContadorId(valor) {
  contador = valor;
}

export function resetContadoresId() {
  contador = 0;
}
