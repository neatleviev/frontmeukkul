<script setup lang="ts">
import Header from './components/Header.vue'; // Certifique-se de que Header.vue existe e o caminho está correto
import { RouterView, RouterLink } from 'vue-router';
</script>

<template>
  <Header />
  <main>
    <RouterView />
  </main>
</template>

<style>
/* Estilos globais para o App.vue ou para o body */
body {
  margin: 0;
  font-family: 'Segoe UI', sans-serif;
  background-color: withe;
}

main {
  padding: 20px;
}

</style>