import { useAuth } from '@/composables/useAuth';

export const API_URL = 'https://ds4-demo-5w8lmtds.on-forge.com/api';

export class ErrorApi extends Error {
  // status 0 = sin conexión
  constructor(public status: number, public cuerpo: any) {
    super(`HTTP ${status}`);
  }
}

// Único cliente HTTP: conoce la URL base, los encabezados y el token
export async function api<T>(ruta: string, op: RequestInit = {}): Promise<T> {
  const { token, cerrarSesion } = useAuth();

  let res: Response;
  try {
    res = await fetch(`${API_URL}${ruta}`, {
      ...op,
      headers: {
        Accept: 'application/json',
        ...(typeof op.body === 'string' && { 'Content-Type': 'application/json' }),
        ...(token.value && { Authorization: `Bearer ${token.value}` }),
      },
    });
  } catch {
    throw new ErrorApi(0, { message: 'Sin conexión con el servidor' });
  }

  if (res.status === 401 && token.value) {
    await cerrarSesion();
  }
  if (!res.ok) {
    const cuerpo = await res.json().catch(() => ({}));
    throw new ErrorApi(res.status, cuerpo);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

// Mensaje legible para mostrar en la vista
export function mensajeDeError(error: unknown): string {
  if (!(error instanceof ErrorApi)) return 'Ocurrió un error inesperado';
  if (error.status === 0) return 'Sin conexión. Revisa tu internet e intenta de nuevo.';
  if (error.status === 401) return 'Credenciales incorrectas o sesión vencida.';
  if (error.status === 422) {
    const errores = error.cuerpo?.errors;
    if (errores) return Object.values(errores).flat().join(' ');
    return error.cuerpo?.message ?? 'Datos inválidos';
  }
  if (error.status === 429) return 'Demasiados intentos. Espera un momento.';
  return error.cuerpo?.message ?? `Error del servidor (${error.status})`;
}

// Prueba varias rutas en orden y usa la primera que exista (salta los 404 y 405).
// Guarda la que funcionó para no volver a probar.
const rutasEncontradas: Record<string, string> = {};

export async function apiPrimeraRuta<T>(nombre: string, rutas: string[], op: RequestInit = {}): Promise<T> {
  const lista = rutasEncontradas[nombre] ? [rutasEncontradas[nombre]] : rutas;
  let ultimoError: unknown;
  for (const ruta of lista) {
    try {
      const r = await api<T>(ruta, op);
      rutasEncontradas[nombre] = ruta;
      console.log(`Ruta de ${nombre}: ${ruta}`);
      return r;
    } catch (e) {
      ultimoError = e;
      if (e instanceof ErrorApi && (e.status === 404 || e.status === 405)) continue;
      rutasEncontradas[nombre] = ruta;
      throw e;
    }
  }
  throw ultimoError;
}
