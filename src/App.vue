<script setup lang="ts">
import Header from './components/Header.vue'; // Certifique-se de que Header.vue existe e o caminho está correto
import { RouterView, RouterLink } from 'vue-router';
</script>

<template>
  <Header />
  <nav class="main-nav">
  </nav>
  <main>
    <RouterView />
  </main>
</template>

<style>
/* Estilos globais para o App.vue ou para o body */
body {
  margin: 0;
  font-family: 'Segoe UI', sans-serif;
  background-color: #f2eee8;
}

main {
  padding: 20px;
}

.main-nav {
  text-align: center;
  padding: 15px;
  background-color: #f8f8f8;
  border-bottom: 1px solid #eee;
}

.main-nav a {
  margin: 0 10px;
  text-decoration: none;
  color: #d56aa0;
  font-weight: bold;
}

.main-nav a.router-link-active {
  color: #a04a74;
  text-decoration: underline;
}
</style>