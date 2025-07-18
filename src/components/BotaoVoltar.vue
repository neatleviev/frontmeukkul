<template>
  <button
    @click="voltar"
    class="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded transition duration-200"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none"
      viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M15 19l-7-7 7-7" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function voltar() {
  router.back()
}
</script>
