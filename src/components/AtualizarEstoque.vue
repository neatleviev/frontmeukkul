<script setup lang="ts">
import { ref } from 'vue'

const resultado = ref<any>(null)
const strapiUrl = 'https://nice-eggs-d79e24d7a7.strapiapp.com'

async function atualizarEstoque() {
  try {
    const response = await fetch(`${strapiUrl}/api/produtos/atualizar-estoque`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        produtos: [
          { id: 1, quantidade: 2 },
          { id: 3, quantidade: 1, varianteId: 5 },
        ],
      }),
    })

    const data = await response.json()
    resultado.value = data
    console.log('✅ Estoque atualizado com sucesso:', data)
  } catch (error) {
    console.error('❌ Erro ao atualizar estoque:', error)
  }
}
</script>

<template>
  <div class="p-4 border rounded bg-gray-100">
    <h2 class="text-lg font-bold mb-2">Testar Atualização de Estoque</h2>
    <button
      @click="atualizarEstoque"
      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
    >
      Atualizar Estoque
    </button>

    <div v-if="resultado" class="mt-4">
      <pre>{{ resultado }}</pre>
    </div>
  </div>
</template>
