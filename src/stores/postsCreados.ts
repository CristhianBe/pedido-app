import { ref } from 'vue';
import { Posts } from '@/interfaces/posts';

// jsonplaceholder no guarda los posts que se crean (siempre responde id 101),
// así que los guardamos en la app para poder verlos en la lista y en el detalle.
const CLAVE = 'postsCreados';

function leerGuardados(): Posts[] {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
  } catch {
    return [];
  }
}

export const postsCreados = ref<Posts[]>(leerGuardados());

export function agregarPostCreado(post: Omit<Posts, 'id'>): Posts {
  // id propio a partir de 101 para que no choque con los 100 de la API
  const ultimoId = postsCreados.value.reduce((max, p) => Math.max(max, p.id), 100);
  const nuevo: Posts = { ...post, id: ultimoId + 1 };
  postsCreados.value = [nuevo, ...postsCreados.value];
  try {
    localStorage.setItem(CLAVE, JSON.stringify(postsCreados.value));
  } catch {
    // si no se puede guardar, igual queda en memoria mientras la app esté abierta
  }
  return nuevo;
}

export function buscarPostCreado(id: number): Posts | undefined {
  return postsCreados.value.find(p => p.id === id);
}
