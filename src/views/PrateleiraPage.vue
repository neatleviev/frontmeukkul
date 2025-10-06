<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import BotaoVoltar from '@/components/BotaoVoltar.vue'
import cardProduto from '@/components/cardProduto.vue'
 
const route = useRoute()
const prateleiraId = ref<string | null>((route.params.id as string) || null)
const prateleiraNome = ref<string | null>(null)
const produtos = ref<any[]>([])

const strapiUrl = 'https://nice-eggs-d79e24d7a7.strapiapp.com'

function getImageUrl(url: string) {
  return url?.startsWith('http')
    ? url
    : `${strapiUrl}${url}`
}

async function fetchPrateleira(id: string) {
  try {
    const res = await fetch(
      `${strapiUrl}/api/prateleiras?filters[id][$eq]=${id}&populate[produtos][populate][0]=fotos&populate[produtos][populate][1]=variantes`
    )
    const json = await res.json()

    const prateleira = json.data?.[0]
    prateleiraNome.value = prateleira?.nome || 'Sem nome'

    produtos.value = (prateleira?.produtos || []).map((p: any) => ({
      id: p.id,
      nome: p.nome,
      preco: p.preco,
      fotos: p.fotos?.map((foto: any) => ({
        url: getImageUrl(foto.url),
        name: foto.name
      })) ?? [],
      estoqueUnico: p.estoqueUnico,
      variantes: p.variantes ?? [],
      ticketPai: p.ticketPai
    }))
  } catch (e) {
    console.error('Erro ao buscar prateleira:', e)
    prateleiraNome.value = 'Erro ao buscar nome'
    produtos.value = []
  }
}

watch(
  () => route.params.id,
  (id) => {
    if (typeof id === 'string') {
      prateleiraId.value = id
      fetchPrateleira(id)
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="p-4 relative space-y-6">
    <!-- Título da prateleira -->
    <h1 class="text-3xl font-bold text-[#d56aa0] text-center mb-4">
      <span v-if="prateleiraNome">{{ prateleiraNome }}</span>
    </h1>

    <!-- Botão de voltar -->
    <div class="absolute left-4 top-4">
      <BotaoVoltar />
    </div>

    <!-- Lista de produtos -->
    <div
      v-if="produtos.length"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <cardProduto
        v-for="produto in produtos"
        :key="produto.ticketPai"
        :product="produto"
      />
    </div>

    <div v-else class="text-center text-gray-500">
      Nenhum produto encontrado para esta prateleira.
    </div>
  </div>
</template>

<style scoped>
</style>
