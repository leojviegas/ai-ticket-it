import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(__dirname, "../../../.env");
const backendEnvPath = path.resolve(__dirname, "../../.env");

dotenv.config({ path: [rootEnvPath, backendEnvPath], quiet: true });

//este archivito es solo para  que el backend cargue siempre ese .env de la raíz (sin importar si ejecutás los comandos parado en la raíz o dentro de backend/)