import { computed, ref } from 'vue';
import { apiPrimeraRuta } from '@/services/api';
import { almacenSeguro } from '@/services/almacenSeguro';

// Fuera de la función: todas las vistas comparten el mismo token
const token = ref<string | null>(null);

export function useAuth() {
  async function login(email: string, password: string) {
    const r = await apiPrimeraRuta<any>('login', ['/login', '/auth/login', '/sanctum/token', '/v1/login', '/v1/auth/login', '/token', '/tokens/create'], {
      method: 'POST',
      body: JSON.stringify({ email, password, device_name: 'app-movil' }),
    });
    // Acepta { token }, { access_token } o { data: { token } }
    const nuevo = r?.token ?? r?.access_token ?? r?.data?.token ?? (typeof r === 'string' ? r : null);
    if (!nuevo) throw new Error('La API no devolvió un token');
    token.value = nuevo;
    await almacenSeguro.set('token', nuevo);
  }

  async function cargarToken() {
    token.value ??= await almacenSeguro.get('token');
  }

  async function cerrarSesion() {
    token.value = null;
    await almacenSeguro.remove('token');
  }

  const estaAutenticado = computed(() => token.value !== null);

  return { token, login, cargarToken, cerrarSesion, estaAutenticado };
}
