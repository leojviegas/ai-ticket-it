import "../config/env.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { Usuario } from "../domain/index.js";
import { usuarioRepository as defaultUsuarioRepository } from "../repositories/index.js";
import { validateSchema } from "../schemas/validator.js";
import { RequestValidationError } from "../controllers/errors/ControllerError.js";
import { BusinessRuleError, ConflictError } from "../services/errors/ServiceError.js";

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

const registerSchema = z.object({
  nombre: z.string({ error: "El nombre es obligatorio" }).trim().min(1, "El nombre es obligatorio"),
  apellido: z
    .string({ error: "El apellido es obligatorio" })
    .trim()
    .min(1, "El apellido es obligatorio"),
  email: z
    .string({ error: "El email es obligatorio" })
    .trim()
    .min(1, "El email es obligatorio")
    .email("El formato del email es inválido"),
  password: z
    .string({ error: "La contraseña debe tener al menos 6 caracteres" })
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

function crearErrorNoAutorizado(mensaje) {
  const error = new BusinessRuleError(mensaje);
  error.status = 401;
  return error;
}

/**
 * Genera un JWT firmado con los datos públicos de la cuenta del usuario.
 */
export function generarAccessToken(usuario) {
  const { secret, expiresIn } = obtenerConfigJwt();
  const payload = {
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    email: usuario.email,
  };
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verifica la firma y vigencia de un JWT emitido por el sistema.
 */
export function verificarAccessToken(token) {
  const { secret } = obtenerConfigJwt();
  return jwt.verify(token, secret);
}

/**                 REGISTRAR USUARIO/SIGN UP
 * Registra un nuevo usuario validando email único y hasheando su contraseña con bcrypt.
 */
export async function registrarUsuario(datos, usuarioRepo = defaultUsuarioRepository) {
  const { nombre, apellido, email, password } = validateSchema(registerSchema, datos ?? {});
  const emailNormalizado = email.toLowerCase();

  if (usuarioRepo.findByEmail(emailNormalizado)) {
    throw new ConflictError("El email ya se encuentra registrado");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const nuevoUsuario = new Usuario({
    nombre,
    apellido,
    email: emailNormalizado,
    passwordHash,
  });
  usuarioRepo.save(nuevoUsuario);

  return {
    accessToken: generarAccessToken(nuevoUsuario),
    usuario: nuevoUsuario.toJSON(),
  };
}

/**
 *                  INICIAR SESION/LOGIN
 * Autentica un usuario validando su email y comparando el hash de contraseña con bcrypt.
 */
export async function iniciarSesion(credenciales, usuarioRepo = defaultUsuarioRepository) {
  if (
    !credenciales ||
    typeof credenciales.email !== "string" ||
    credenciales.email.trim() === "" ||
    typeof credenciales.password !== "string" ||
    credenciales.password.trim() === ""
  ) {
    throw new RequestValidationError("El email y la contraseña son obligatorios");
  }

  const usuario = usuarioRepo.findByEmail(credenciales.email);
  if (!usuario || !usuario.passwordHash) {
    throw crearErrorNoAutorizado("Credenciales inválidas");
  }

  const passwordValida = await bcrypt.compare(credenciales.password, usuario.passwordHash);
  if (!passwordValida) {
    throw crearErrorNoAutorizado("Credenciales inválidas");
  }

  return {
    accessToken: generarAccessToken(usuario),
    usuario: usuario.toJSON(),
  };
}

/**
 * Middleware Express para registrar una cuenta y devolver el JWT inicial.
 */
export async function register(req, res, next) {
  try {
    const resultado = await registrarUsuario(req.body);
    req.user = resultado.usuario;
    return res.status(201).json(resultado);
  } catch (error) {
    return next(error);
  }
}

/**
 * Middleware Express para iniciar sesión y emitir el JWT de acceso.
 */
export async function login(req, res, next) {
  try {
    const resultado = await iniciarSesion(req.body);
    req.user = resultado.usuario;
    return res.status(200).json(resultado);
  } catch (error) {
    return next(error);
  }
}

/**
 * Middleware Express que valida el header Authorization Bearer y deja el payload en req.user.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers?.authorization;
  if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de autenticación no proporcionado" });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({ error: "Token de autenticación no proporcionado" });
  }

  try {
    req.user = verificarAccessToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}
