<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Órdenes</ion-title>
        <ion-buttons v-if="estaAutenticado" slot="end">
          <ion-button @click="salir">
            <ion-icon slot="icon-only" :icon="logOutOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">

      <!-- Inicio de sesión -->
      <template v-if="!estaAutenticado">
        <h2>Iniciar sesión</h2>
        <ion-list>
          <ion-item>
            <ion-input
              v-model="form.email"
              type="email"
              inputmode="email"
              autocomplete="email"
              label="Correo"
              label-placement="stacked"
              placeholder="correo@ejemplo.com"
            />
          </ion-item>
          <ion-item>
            <ion-input
              v-model="form.password"
              type="password"
              label="Contraseña"
              label-placement="stacked"
            >
              <ion-input-password-toggle slot="end" />
            </ion-input>
          </ion-item>
        </ion-list>

        <ion-text v-if="error" color="danger"><p>{{ error }}</p></ion-text>

        <ion-button expand="block" :disabled="cargando" @click="entrar">
          <ion-spinner v-if="cargando" slot="start" name="crescent" />
          Entrar
        </ion-button>
      </template>

      <!-- Órdenes -->
      <template v-else>
        <ion-refresher slot="fixed" @ion-refresh="refrescar($event)">
          <ion-refresher-content />
        </ion-refresher>

        <div v-if="cargando" class="ion-text-center ion-padding">
          <ion-spinner name="crescent" />
        </div>

        <ion-text v-else-if="error" color="danger">
          <p>{{ error }}</p>
          <ion-button fill="outline" @click="cargarOrdenes">Reintentar</ion-button>
        </ion-text>

        <p v-else-if="!ordenes.length">No hay órdenes todavía.</p>

        <ion-list v-else>
          <ion-item v-for="orden in ordenes" :key="orden.id">
            <ion-label>
              <h2>Orden #{{ orden.id }}</h2>
              <p v-for="[clave, valor] in camposVisibles(orden)" :key="clave">
                <strong>{{ clave }}:</strong> {{ valor }}
              </p>
            </ion-label>
          </ion-item>
        </ion-list>
      </template>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
  IonInput, IonInputPasswordToggle, IonButton, IonButtons, IonIcon, IonSpinner, IonText,
  IonRefresher, IonRefresherContent,
} from '@ionic/vue';
import { logOutOutline } from 'ionicons/icons';
import { ref, watch } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { api, mensajeDeError } from '@/services/api';

// Ruta de las órdenes en la API (cámbiala si el profe usa otra, p. ej. '/orders')
const RUTA_ORDENES = '/ordenes';

type Orden = { id: number | string; [clave: string]: unknown };

const { login, cargarToken, cerrarSesion, estaAutenticado } = useAuth();

const form = ref({ email: '', password: '' });
const ordenes = ref<Orden[]>([]);
const cargando = ref(false);
const error = ref('');

async function entrar() {
  error.value = '';
  if (!form.value.email.trim() || !form.value.password) {
    error.value = 'Escribe el correo y la contraseña.';
    return;
  }
  cargando.value = true;
  try {
    await login(form.value.email.trim(), form.value.password);
    form.value.password = '';
  } catch (e) {
    console.log(e);
    error.value = e instanceof Error && !('status' in e) ? e.message : mensajeDeError(e);
  } finally {
    cargando.value = false;
  }
}

async function cargarOrdenes() {
  error.value = '';
  cargando.value = true;
  try {
    const r = await api<any>(RUTA_ORDENES);
    // Acepta un arreglo directo o paginado { data: [...] }
    ordenes.value = Array.isArray(r) ? r : (r?.data ?? []);
  } catch (e) {
    console.log(e);
    error.value = mensajeDeError(e);
  } finally {
    cargando.value = false;
  }
}

async function refrescar(evento: CustomEvent) {
  await cargarOrdenes();
  (evento.target as HTMLIonRefresherElement).complete();
}

async function salir() {
  try {
    await api('/logout', { method: 'POST' });
  } catch {
    // aunque falle en el servidor, se borra el token local
  }
  await cerrarSesion();
  ordenes.value = [];
}

// Muestra hasta 4 campos simples de la orden (sin id ni fechas internas)
function camposVisibles(orden: Orden): [string, unknown][] {
  return Object.entries(orden)
    .filter(([k, v]) => k !== 'id' && !['created_at', 'updated_at', 'deleted_at'].includes(k) && (v === null || typeof v !== 'object'))
    .slice(0, 4);
}

// Al iniciar o cerrar sesión, carga o limpia las órdenes
watch(estaAutenticado, (auth) => {
  if (auth) cargarOrdenes();
  else ordenes.value = [];
});

cargarToken().then(() => {
  if (estaAutenticado.value) cargarOrdenes();
});
</script>
