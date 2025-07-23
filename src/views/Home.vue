<template>
  <div class="p-8">
  
    <!-- Loop em cada super vitrine -->
    <div
      v-for="vitrine in superVitrines"
      :key="vitrine.id"
      class="mb-12"
    >
      <h2 class="text-2xl font-semibold text-pink-600 mb-4 text-center uppercase">
        {{ vitrine.nome }}
      </h2>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
        v-if="vitrine.produtos?.length"
      >
        <CardProduto
          v-for="produto in vitrine.produtos"
          :key="produto.id"
          :product="produto"
        />
      </div>

      <div v-else class="text-center text-gray-500">
        Nenhum produto disponível nesta vitrine.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CardProduto from '@/components/CardProduto.vue'

const superVitrines = ref<any[]>([])

onMounted(async () => {
  try {
    const response = await fetch(
  'https://nice-eggs-d79e24d7a7.strapiapp.com/api/super-vitrines?populate[produtos][populate]=*'
)


    if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`)

    const json = await response.json()
    superVitrines.value = json.data.map((item: any) => ({
      id: item.id,
      nome: item.nome,
      produtos: (item.produtos || []).map((product: any) => ({
        ...product,
        descricaoTratada: (product.descricao || []).map((p: any) => p.children?.[0]?.text || '')
      }))
    }))
  } catch (error) {
    console.error('Erro ao buscar super vitrines:', error)
  }
})



</script>
