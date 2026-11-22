import bcrypt from "bcryptjs";
import {
  Categoria,
  Usuario,
  TipoEntrada,
  Evento,
  Compra,
  Resenia,
  EstadoCompra,
} from "../../src/domain/index.js";
import {
  resetContadoresId,
  establecerContadorId,
} from "../../src/domain/utils/idGenerator.js";
import {
  categoriaRepository,
  usuarioRepository,
  eventoRepository,
  compraRepository,
  reseniaRepository,
  clearAllRepositories,
} from "../../src/repositories/index.js";

const MS_POR_DIA = 86400000;
export const DEMO_PASSWORD = "123456";
const DEMO_PASSWORD_HASH = bcrypt.hashSync(DEMO_PASSWORD, 10);

function fechaRelativa(dias) {
  return new Date(Date.now() + dias * MS_POR_DIA);
}

export function seedDemo() {
  clearAllRepositories();
  resetContadoresId();

  // 1. Categorías
  const catRecitales = categoriaRepository.save(
    new Categoria({
      id: 1,
      nombre: "Recitales",
      descripcion: "Shows musicales y conciertos en vivo",
    })
  );
  const catTeatro = categoriaRepository.save(
    new Categoria({
      id: 2,
      nombre: "Teatro",
      descripcion: "Obras teatrales, stand-up y musicales",
    })
  );
  const catFestivales = categoriaRepository.save(
    new Categoria({
      id: 3,
      nombre: "Festivales",
      descripcion: "Festivales al aire libre con múltiples artistas",
    })
  );
  const catConferencias = categoriaRepository.save(
    new Categoria({
      id: 4,
      nombre: "Conferencias",
      descripcion: "Charlas de tecnología, diseño e innovación",
    })
  );
  const catDeportes = categoriaRepository.save(
    new Categoria({
      id: 5,
      nombre: "Deportes",
      descripcion: "Partidos, torneos y exhibiciones deportivas",
    })
  );

  // 2. Usuarios (todos pueden comprar y organizar eventos; contraseña demo: "123456")
  const sofia = usuarioRepository.save(
    new Usuario({
      id: 1,
      nombre: "Sofía",
      apellido: "Martínez",
      email: "sofia@ticketit.com",
      passwordHash: DEMO_PASSWORD_HASH,
    })
  );
  const lucas = usuarioRepository.save(
    new Usuario({
      id: 2,
      nombre: "Lucas",
      apellido: "Fernández",
      email: "lucas@ticketit.com",
      passwordHash: DEMO_PASSWORD_HASH,
    })
  );
  const valentina = usuarioRepository.save(
    new Usuario({
      id: 3,
      nombre: "Valentina",
      apellido: "Gómez",
      email: "valentina@ticketit.com",
      passwordHash: DEMO_PASSWORD_HASH,
    })
  );
  const mateo = usuarioRepository.save(
    new Usuario({
      id: 4,
      nombre: "Mateo",
      apellido: "Rossi",
      email: "mateo@ticketit.com",
      passwordHash: DEMO_PASSWORD_HASH,
    })
  );

  // 3. Eventos pasados (para historial de reseñas y reputación de organizadores)
  const entradaPasadoRock = new TipoEntrada({
    id: 101,
    nombre: "Campo General",
    descripcion: "Acceso general al estadio",
    precio: 18000,
    cupo: 14,
  });
  const eventoPasadoLucas = eventoRepository.save(
    new Evento({
      id: 1,
      nombre: "Noche Acústica 2025",
      descripcion: "Sesión íntima con bandas independientes locales",
      categoria: catRecitales,
      fecha: fechaRelativa(-30),
      tiposEntrada: [entradaPasadoRock],
      multimedia: ["https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800"],
      organizador: lucas,
    })
  );

  const entradaPasadoTeatro = new TipoEntrada({
    id: 102,
    nombre: "Platea Central",
    descripcion: "Ubicación preferencial frente al escenario",
    precio: 12000,
    cupo: 7,
  });
  const eventoPasadoSofia = eventoRepository.save(
    new Evento({
      id: 2,
      nombre: "Comedia de Medianoche",
      descripcion: "Obra de teatro premiada en temporada pasada",
      categoria: catTeatro,
      fecha: fechaRelativa(-15),
      tiposEntrada: [entradaPasadoTeatro],
      multimedia: ["https://images.unsplash.com/photo-1503095396549-807759245b35?w=800"],
      organizador: sofia,
    })
  );

  const entradaPasadoDeporte = new TipoEntrada({
    id: 103,
    nombre: "Tribuna Norte",
    descripcion: "Acceso general a tribuna",
    precio: 9000,
    cupo: 21,
  });
  const eventoPasadoValentina = eventoRepository.save(
    new Evento({
      id: 3,
      nombre: "Torneo Urbano de Básquet 3x3",
      descripcion: "Competencia relámpago de equipos amateur",
      categoria: catDeportes,
      fecha: fechaRelativa(-10),
      tiposEntrada: [entradaPasadoDeporte],
      multimedia: ["https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800"],
      organizador: valentina,
    })
  );

  // 4. Eventos futuros (activos para compra, búsqueda y ordenamiento)
  const entradaRockGeneral = new TipoEntrada({
    id: 201,
    nombre: "General",
    descripcion: "Campo de pie con acceso a barras",
    precio: 22000,
    cupo: 120,
  });
  const entradaRockVip = new TipoEntrada({
    id: 202,
    nombre: "VIP Lounge",
    descripcion: "Terraza preferencial con vista al escenario",
    precio: 48000,
    cupo: 25,
  });
  const eventoFuturoRock = eventoRepository.save(
    new Evento({
      id: 4,
      nombre: "Festival Indie Primavera",
      descripcion: "Dos escenarios al aire libre con las mejores bandas indie del país",
      categoria: catFestivales,
      fecha: fechaRelativa(12),
      tiposEntrada: [entradaRockGeneral, entradaRockVip],
      multimedia: ["https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800"],
      organizador: lucas,
    })
  );

  const entradaTechEarly = new TipoEntrada({
    id: 203,
    nombre: "Early Bird",
    descripcion: "Acceso completo a charlas y workshops",
    precio: 15000,
    cupo: 40,
  });
  const entradaTechFull = new TipoEntrada({
    id: 204,
    nombre: "Full Pass + Networking",
    descripcion: "Incluye almuerzo y sesión de mentoría con speakers",
    precio: 32000,
    cupo: 15,
  });
  const eventoFuturoTech = eventoRepository.save(
    new Evento({
      id: 5,
      nombre: "AI & Software Summit",
      descripcion: "Jornada intensiva sobre ingeniería de software e inteligencia artificial",
      categoria: catConferencias,
      fecha: fechaRelativa(6),
      tiposEntrada: [entradaTechEarly, entradaTechFull],
      multimedia: ["https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800"],
      organizador: sofia,
    })
  );

  const entradaTeatroPlatea = new TipoEntrada({
    id: 205,
    nombre: "Platea",
    descripcion: "Filas 1 a 10 con excelente acústica",
    precio: 14000,
    cupo: 30,
  });
  const entradaTeatroPullman = new TipoEntrada({
    id: 206,
    nombre: "Pullman",
    descripcion: "Bandeja superior panorámica",
    precio: 8500,
    cupo: 50,
  });
  const eventoFuturoTeatro = eventoRepository.save(
    new Evento({
      id: 6,
      nombre: "El Último Acto",
      descripcion: "Drama contemporáneo dirigido por elenco nacional",
      categoria: catTeatro,
      fecha: fechaRelativa(25),
      tiposEntrada: [entradaTeatroPullman, entradaTeatroPlatea],
      multimedia: ["https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800"],
      organizador: sofia,
    })
  );

  const entradaDeporteGeneral = new TipoEntrada({
    id: 207,
    nombre: "Popular",
    descripcion: "Acceso a tribuna general",
    precio: 6000,
    cupo: 200,
  });
  const eventoFuturoDeporte = eventoRepository.save(
    new Evento({
      id: 7,
      nombre: "Copa Ciudad Nocturna",
      descripcion: "Final del campeonato metropolitano bajo las luces",
      categoria: catDeportes,
      fecha: fechaRelativa(19),
      tiposEntrada: [entradaDeporteGeneral],
      multimedia: ["https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800"],
      organizador: valentina,
    })
  );

  // Favoritos iniciales
  sofia.agregarFavorito(eventoFuturoRock);
  mateo.agregarFavorito(eventoFuturoTech);
  mateo.agregarFavorito(eventoFuturoRock);

  // 5. Compras en todos los estados para demostración inmediata
  // Compra 1: UTILIZADA (ya reseñada) - Sofía asistió al recital pasado de Lucas
  entradaPasadoRock.descontarCupo(2);
  const compraUtilizadaReseniada = new Compra({
    id: 1,
    comprador: sofia,
    evento: eventoPasadoLucas,
    tipoEntrada: entradaPasadoRock,
    cantidad: 2,
    estado: EstadoCompra.PENDIENTE,
  });
  compraUtilizadaReseniada.actualizarEstado(EstadoCompra.CONFIRMADA, lucas, fechaRelativa(-35));
  compraUtilizadaReseniada.actualizarEstado(EstadoCompra.UTILIZADA, lucas, fechaRelativa(-30));
  compraRepository.save(compraUtilizadaReseniada);

  // Compra 2: UTILIZADA (sin reseñar aún, para probar CU 9 en vivo con Mateo)
  entradaPasadoRock.descontarCupo(1);
  const compraUtilizadaPendienteResenia = new Compra({
    id: 2,
    comprador: mateo,
    evento: eventoPasadoLucas,
    tipoEntrada: entradaPasadoRock,
    cantidad: 1,
    estado: EstadoCompra.PENDIENTE,
  });
  compraUtilizadaPendienteResenia.actualizarEstado(
    EstadoCompra.CONFIRMADA,
    lucas,
    fechaRelativa(-34)
  );
  compraUtilizadaPendienteResenia.actualizarEstado(
    EstadoCompra.UTILIZADA,
    lucas,
    fechaRelativa(-30)
  );
  compraRepository.save(compraUtilizadaPendienteResenia);

  // Compra 3: UTILIZADA en evento pasado de Sofía (para reseña de Lucas)
  entradaPasadoTeatro.descontarCupo(2);
  const compraPasadaTeatro = new Compra({
    id: 3,
    comprador: lucas,
    evento: eventoPasadoSofia,
    tipoEntrada: entradaPasadoTeatro,
    cantidad: 2,
    estado: EstadoCompra.PENDIENTE,
  });
  compraPasadaTeatro.actualizarEstado(EstadoCompra.CONFIRMADA, sofia, fechaRelativa(-20));
  compraPasadaTeatro.actualizarEstado(EstadoCompra.UTILIZADA, sofia, fechaRelativa(-15));
  compraRepository.save(compraPasadaTeatro);

  // Compra 4: UTILIZADA en evento pasado de Valentina (para reseña de Mateo)
  entradaPasadoDeporte.descontarCupo(1);
  const compraPasadaDeporte = new Compra({
    id: 4,
    comprador: mateo,
    evento: eventoPasadoValentina,
    tipoEntrada: entradaPasadoDeporte,
    cantidad: 1,
    estado: EstadoCompra.PENDIENTE,
  });
  compraPasadaDeporte.actualizarEstado(EstadoCompra.CONFIRMADA, valentina, fechaRelativa(-14));
  compraPasadaDeporte.actualizarEstado(EstadoCompra.UTILIZADA, valentina, fechaRelativa(-10));
  compraRepository.save(compraPasadaDeporte);

  // Compra 5: CONFIRMADA en evento futuro (CU 1: muestra días faltantes + CU 5/6: chat activo)
  entradaRockGeneral.descontarCupo(2);
  const compraConfirmadaFutura = new Compra({
    id: 5,
    comprador: sofia,
    evento: eventoFuturoRock,
    tipoEntrada: entradaRockGeneral,
    cantidad: 2,
    estado: EstadoCompra.PENDIENTE,
  });
  compraConfirmadaFutura.actualizarEstado(EstadoCompra.CONFIRMADA, lucas, fechaRelativa(-2));
  compraConfirmadaFutura.agregarMensaje(
    sofia,
    "Hola Lucas, ¿a qué hora abren las puertas del festival?",
    fechaRelativa(-1)
  );
  compraConfirmadaFutura.agregarMensaje(
    lucas,
    "Hola Sofía, las puertas abren a las 17:00 hs y el primer show arranca a las 18:30.",
    fechaRelativa(-1)
  );
  compraRepository.save(compraConfirmadaFutura);

  // Compra 6: PENDIENTE en evento futuro (lista para que Sofía confirme o cancele)
  entradaTechEarly.descontarCupo(1);
  const compraPendiente = new Compra({
    id: 6,
    comprador: mateo,
    evento: eventoFuturoTech,
    tipoEntrada: entradaTechEarly,
    cantidad: 1,
    estado: EstadoCompra.PENDIENTE,
  });
  compraPendiente.agregarMensaje(
    mateo,
    "Buenas tardes, acabo de enviar la transferencia por el pase Early Bird.",
    fechaRelativa(-1)
  );
  compraRepository.save(compraPendiente);

  // Compra 7: CANCELADA en evento futuro (lista para que el organizador la reembolse)
  const compraCancelada = new Compra({
    id: 7,
    comprador: valentina,
    evento: eventoFuturoRock,
    tipoEntrada: entradaRockVip,
    cantidad: 1,
    estado: EstadoCompra.PENDIENTE,
  });
  compraCancelada.actualizarEstado(EstadoCompra.CONFIRMADA, lucas, fechaRelativa(-3));
  compraCancelada.actualizarEstado(EstadoCompra.CANCELADA, valentina, fechaRelativa(-1));
  compraRepository.save(compraCancelada);

  // Compra 8: REEMBOLSADA en evento futuro
  const compraReembolsada = new Compra({
    id: 8,
    comprador: mateo,
    evento: eventoFuturoTeatro,
    tipoEntrada: entradaTeatroPlatea,
    cantidad: 2,
    estado: EstadoCompra.PENDIENTE,
  });
  compraReembolsada.actualizarEstado(EstadoCompra.CONFIRMADA, sofia, fechaRelativa(-5));
  compraReembolsada.actualizarEstado(EstadoCompra.CANCELADA, mateo, fechaRelativa(-4));
  compraReembolsada.actualizarEstado(EstadoCompra.REEMBOLSADA, sofia, fechaRelativa(-3));
  compraRepository.save(compraReembolsada);

  // Compra 9: UTILIZADA (ya reseñada) - Valentina asistió al recital pasado de Lucas
  entradaPasadoRock.descontarCupo(1);
  const compraValentinaPasado = new Compra({
    id: 9,
    comprador: valentina,
    evento: eventoPasadoLucas,
    tipoEntrada: entradaPasadoRock,
    cantidad: 1,
    estado: EstadoCompra.PENDIENTE,
  });
  compraValentinaPasado.actualizarEstado(EstadoCompra.CONFIRMADA, lucas, fechaRelativa(-33));
  compraValentinaPasado.actualizarEstado(EstadoCompra.UTILIZADA, lucas, fechaRelativa(-30));
  compraRepository.save(compraValentinaPasado);

  // 6. Reseñas de eventos pasados (construyen el puntaje de cada organizador)
  reseniaRepository.save(
    new Resenia({
      id: 1,
      comprador: sofia,
      evento: eventoPasadoLucas,
      puntuacion: 5,
      detalle: "Sonido impecable, excelente organización y acceso súper ágil.",
    })
  );
  reseniaRepository.save(
    new Resenia({
      id: 2,
      comprador: valentina,
      evento: eventoPasadoLucas,
      puntuacion: 4.5,
      detalle: "Gran ambiente y puntualidad en los horarios de las bandas.",
    })
  );
  reseniaRepository.save(
    new Resenia({
      id: 3,
      comprador: lucas,
      evento: eventoPasadoSofia,
      puntuacion: 4,
      detalle: "Muy buena obra y teatro cómodo, solo un poco de demora en el ingreso.",
    })
  );
  reseniaRepository.save(
    new Resenia({
      id: 4,
      comprador: mateo,
      evento: eventoPasadoValentina,
      puntuacion: 3.5,
      detalle: "Divertido torneo, faltaría señalizar mejor los accesos.",
    })
  );

  // Ajustar contador autoincremental para que los nuevos registros creados vía API
  // no colisionen con los IDs explícitos de los seeders.
  establecerContadorId(300);
}
