import "../config/env.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Usuario } from "../domain/index.js";
import { BusinessRuleError, ConflictError } from "./errors/ServiceError.js";

const SALT_ROUNDS = 10;

function obtenerConfigJwt() {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN;
  if (!secret) {
    throw new Error("La variable de entorno JWT_SECRET no está definida en .env");
  }
  if (!expiresIn) {
    throw new Error("La variable de entorno JWT_EXPIRES_IN no está definida en .env");
  }
  return { secret, expiresIn };
}

function crearErrorNoAutorizado(mensaje) {
  const error = new BusinessRuleError(mensaje);
  error.status = 401;
  return error;
}

export class AuthService {
  constructor({ usuarioRepository }) {
    this.usuarioRepository = usuarioRepository;
  }

  generarAccessToken(usuario) {
    const { secret, expiresIn } = obtenerConfigJwt();
    const payload = {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
    };
    return jwt.sign(payload, secret, { expiresIn });
  }

  verificarAccessToken(token) {
    const { secret } = obtenerConfigJwt();
    return jwt.verify(token, secret);
  }

  async register({ nombre, apellido, email, password }) {
    const emailNormalizado = email.trim().toLowerCase();

    if (this.usuarioRepository.findByEmail(emailNormalizado)) {
      throw new ConflictError("El email ya se encuentra registrado");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const nuevoUsuario = new Usuario({
      nombre,
      apellido,
      email: emailNormalizado,
      passwordHash,
    });
    this.usuarioRepository.save(nuevoUsuario);

    return {
      accessToken: this.generarAccessToken(nuevoUsuario),
      usuario: nuevoUsuario.toJSON(),
    };
  }

  async login({ email, password }) {
    const usuario = this.usuarioRepository.findByEmail(email);
    if (!usuario || !usuario.passwordHash) {
      throw crearErrorNoAutorizado("Credenciales inválidas");
    }

    const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValida) {
      throw crearErrorNoAutorizado("Credenciales inválidas");
    }

    return {
      accessToken: this.generarAccessToken(usuario),
      usuario: usuario.toJSON(),
    };
  }
}
