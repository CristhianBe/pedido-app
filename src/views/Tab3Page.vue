<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Nuevo post</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="ion-padding">

      <ion-button expand="block" fill="outline" @click="escanearQR">
        <ion-icon slot="start" :icon="qrCodeOutline" />
        Escanear QR
      </ion-button>

      <ion-list>
        <ion-item>
          <ion-select
            v-model="post.userId"
            label="Usuario"
            label-placement="stacked"
            placeholder="Selecciona un usuario"
            interface="action-sheet"
            cancel-text="Cancelar"
          >
            <ion-select-option v-for="usuario in usuarios" :key="usuario.id" :value="usuario.id">
              {{ usuario.name }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-input
            v-model="post.title"
            label="Título"
            label-placement="stacked"
            placeholder="Título del post"
          />
        </ion-item>
        <ion-item>
          <ion-textarea
            v-model="post.body"
            label="Contenido"
            label-placement="stacked"
            placeholder="Escribe el contenido..."
            :auto-grow="true"
            :rows="4"
          />
        </ion-item>
      </ion-list>

      <ion-button expand="block" :disabled="enviando" @click="guardarPost">
        <ion-spinner v-if="enviando" slot="start" name="crescent" />
        Guardar
      </ion-button>

      <ion-toast
        :is-open="toast.abierto"
        :message="toast.mensaje"
        :color="toast.color"
        :duration="2500"
        position="bottom"
        @did-dismiss="toast.abierto = false"
      />

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { Posts } from '@/interfaces/posts';
import { Usuarios } from '@/interfaces/usuarios';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonInput, IonTextarea, IonButton, IonIcon, IonSpinner, IonToast,
  IonSelect, IonSelectOption,
} from '@ionic/vue';
import { qrCodeOutline } from 'ionicons/icons';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';
import { ref } from 'vue';
import { agregarPostCreado } from '@/stores/postsCreados';

// userId en null hasta que el usuario lo seleccione
type NuevoPost = Omit<Posts, 'id' | 'userId'> & { userId: number | null };

function postVacio(): NuevoPost {
  return { userId: null, title: '', body: '' };
}

const post = ref<NuevoPost>(postVacio());
const usuarios = ref<Usuarios[]>([]);

function cargarUsuarios(){

  fetch('https://jsonplaceholder.typicode.com/users')
  .then(response => response.json())
  .then(json => {
    usuarios.value = json;
  })
  .catch(error => {
    console.log(error);
    mostrarToast('No se pudieron cargar los usuarios', 'danger');
  })

}
cargarUsuarios();
const enviando = ref(false);
const toast = ref({ abierto: false, mensaje: '', color: 'success' });

function mostrarToast(mensaje: string, color = 'success') {
  toast.value = { abierto: true, mensaje, color };
}

// Busca la primera clave presente (sin distinguir mayúsculas) en un objeto
function tomar(obj: Record<string, unknown>, claves: string[]): unknown {
  const entradas = Object.entries(obj).map(([k, v]) => [k.trim().toLowerCase(), v] as const);
  for (const clave of claves) {
    const encontrada = entradas.find(([k]) => k === clave);
    if (encontrada && encontrada[1] !== undefined && encontrada[1] !== null) return encontrada[1];
  }
  return undefined;
}

const CLAVES_TITULO = ['title', 'titulo', 'título'];
const CLAVES_CUERPO = ['body', 'cuerpo', 'contenido'];

// El QR solo rellena title y body; el usuario se elige en el select.
// Devuelve los campos que faltaron (null si no encontró ninguno)
function aplicarDatos(datos: Record<string, unknown>): string[] | null {
  const title = tomar(datos, CLAVES_TITULO);
  const body = tomar(datos, CLAVES_CUERPO);

  if (title === undefined && body === undefined) return null;

  const nuevo = { ...post.value };
  if (title !== undefined) nuevo.title = String(title);
  if (body !== undefined) nuevo.body = String(body);
  post.value = nuevo;

  const faltantes: string[] = [];
  if (title === undefined) faltantes.push('title');
  if (body === undefined) faltantes.push('body');
  return faltantes;
}

// Rellena el formulario; devuelve los campos que no venían en el QR
function rellenarDesdeTexto(texto: string): string[] {
  // 1) JSON
  try {
    const json = JSON.parse(texto);
    if (json && typeof json === 'object' && !Array.isArray(json)) {
      const faltantes = aplicarDatos(json);
      if (faltantes) return faltantes;
    }
  } catch {
    // no es JSON, seguimos
  }

  // 2) "clave: valor" por línea
  const pares: Record<string, string> = {};
  for (const linea of texto.split(/\r?\n/)) {
    const idx = linea.indexOf(':');
    if (idx > 0) {
      pares[linea.slice(0, idx)] = linea.slice(idx + 1).trim();
    }
  }
  const faltantes = aplicarDatos(pares);
  if (faltantes) return faltantes;

  // 3) Todo el texto al body
  post.value = { ...post.value, body: texto };
  return ['title'];
}

async function escanearQR() {
  try {
    const resultado = await CapacitorBarcodeScanner.scanBarcode({
      hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
    });
    const texto = resultado?.ScanResult?.trim();
    if (!texto) {
      mostrarToast('Escaneo cancelado', 'medium');
      return;
    }
    const faltantes = rellenarDesdeTexto(texto);
    if (faltantes.length === 0) {
      mostrarToast('Formulario rellenado desde el QR');
    } else {
      mostrarToast('El QR no trae: ' + faltantes.join(', '), 'warning');
    }
  } catch (error) {
    console.log(error);
    mostrarToast('Escaneo cancelado o no disponible', 'warning');
  }
}

async function guardarPost() {
  if (post.value.userId === null) {
    mostrarToast('Selecciona un usuario', 'warning');
    return;
  }
  if (!post.value.title.trim() || !post.value.body.trim()) {
    mostrarToast('El título y el contenido son obligatorios', 'warning');
    return;
  }

  enviando.value = true;
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      body: JSON.stringify(post.value),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    });

    if (response.status !== 201) {
      throw new Error('Respuesta inesperada: ' + response.status);
    }

    const json: Posts = await response.json();
    console.log(json);
    const guardado = agregarPostCreado({
      userId: post.value.userId as number,
      title: post.value.title,
      body: post.value.body,
    });
    mostrarToast(`Post creado #${guardado.id}`);
    post.value = postVacio();
  } catch (error) {
    console.log(error);
    mostrarToast('Error al crear el post', 'danger');
  } finally {
    enviando.value = false;
  }
}
</script>
