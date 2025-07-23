<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PrateleiraProdutos from '@/components/PrateleiraProdutos.vue'
import BotaoVoltar from '@/components/BotaoVoltar.vue'
import CardProduto from '@/components/CardProduto.vue'

const route = useRoute()
const prateleiraId = ref<string | null>((route.params.id as string) || null)
const prateleiraNome = ref<string | null>(null)

const strapiUrl = 'https://nice-eggs-d79e24d7a7.strapiapp.com'

async function fetchNome(id: string) {
  try {
    const res = await fetch(`${strapiUrl}/api/prateleiras?filters[id][$eq]=${id}`)
    const json = await res.json()
    
    prateleiraNome.value = json.data?.[0]?.nome || 'Sem nome'
  } catch {
    prateleiraNome.value = 'Erro ao buscar nome'
  }
}

watch(
  () => route.params.id,
  (id) => {
    if (typeof id === 'string') {
      prateleiraId.value = id
      fetchNome(id)
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="p-4 relative">
    <h1 class="text-3xl font-bold text-[#d56aa0] text-center mb-4">
      <span v-if="prateleiraNome">{{ prateleiraNome }}</span>
    </h1>

    <div class="absolute left-4 top-4">
      <BotaoVoltar />
    </div>

    <PrateleiraProdutos :prateleiraId="prateleiraId">
      <template #default="{ loading, error, data, loaded }">
        <div v-if="error" class="text-red-500">Erro: {{ error }}</div>
        <div v-else-if="data.length === 0 && loaded" class="text-gray-500">Nenhum produto encontrado.</div>
        <div v-else>
          <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            <CardProduto
              v-for="product in data"
              :key="product.id"
              :product="product"
            />
          </ul>
        </div>
      </template>
    </PrateleiraProdutos>
  </div>
</template>

<style scoped>
img {
  transition: opacity 1s ease-in-out;
}
</style>
