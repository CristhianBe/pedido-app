<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Posts</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">

      <ion-list>
        <ion-item v-for="post in todosLosPosts" :key="post.id" :router-link="`/posts/${post.id}`">
          <ion-label>
            <h2>{{ post.title }}</h2>
            <p>{{ post.body }}</p>
          </ion-label>
        </ion-item>
      </ion-list>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { Posts } from '@/interfaces/posts';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel } from '@ionic/vue';
import { computed, ref } from 'vue';
import { postsCreados } from '@/stores/postsCreados';

const posts = ref<Posts[]>([]);

// Primero los creados desde el Tab 3, después los de la API
const todosLosPosts = computed(() => [...postsCreados.value, ...posts.value]);

function cargarPosts(){

  fetch('https://jsonplaceholder.typicode.com/posts')
  .then(response => response.json())
  .then(json => {
    console.log(json);
    posts.value = json;
  })

}
cargarPosts();

</script>
