<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import PrateleiraProdutos from '@/components/PrateleiraProdutos.vue'
import { useProdutoStore } from '@/stores/useProdutoStore'
import BotaoVoltar from '@/components/BotaoVoltar.vue'
import CardProduto from '@/components/CardProduto.vue'

const produtoStore = useProdutoStore()
const route = useRoute()

const prateleiraId = ref<string | null>((route.params.id as string) || null)
const prateleiraNome = ref<string | null>(null)

const strapiUrl = 'https://nice-eggs-d79e24d7a7.strapiapp.com'
const isTouchDevice = ref(false)

const dropdowns = ref<Record<number, boolean>>({})
const closeTimers = ref<Record<number, number>>({})
const selectedVarianteMap = ref<Record<number, any>>({})
const quantityMap = ref<Record<number, number>>({})
const currentImageIndexMap = ref<Record<number, number>>({})
const intervalMap = ref<Record<number, any>>({})

onMounted(() => {
  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
})

onBeforeUnmount(() => {
  Object.values(intervalMap.value).forEach(clearInterval)
})

function openDropdown(productId: number) {
  clearTimeout(closeTimers.value[productId])
  dropdowns.value[productId] = true
}

function closeDropdown(productId: number) {
  closeTimers.value[productId] = window.setTimeout(() => {
    dropdowns.value[productId] = false
  }, 200)
}

function onDropdownMouseEnter(productId: number) {
  const timeoutId = closeTimers.value[productId]
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
}

function toggleDropdown(productId: number) {
  dropdowns.value[productId] = !dropdowns.value[productId]
}

function selectVariante(productId: number, product: any, variante: any) {
  selectedVarianteMap.value[productId] = variante
  quantityMap.value[productId] = 1

  const produtoComVariante = {
    ...product,
    selectedVariante: variante,
    quantidadeSelecionada: 1
  }

  produtoStore.setProdutoSelecionado(produtoComVariante)

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('produtoSelecionado', JSON.stringify(produtoComVariante))
  }

  dropdowns.value[productId] = false
}

function formatarVariante(v: any): string {
  if (!v) return ''
  return `${v.tamanho || ''} | ${v.cor || ''} | ${v.aroma || ''} | ${v.funcao || ''}`
}

function aumentarQuantidade(productId: number, max: number) {
  if (quantityMap.value[productId] < max) {
    quantityMap.value[productId]++
  }
}

function diminuirQuantidade(productId: number) {
  if (quantityMap.value[productId] > 1) {
    quantityMap.value[productId]--
  }
}

function inicializarQuantidadeUnica(product: any) {
  if (!product.variantes?.length && product.estoqueUnico && !quantityMap.value[product.id]) {
    quantityMap.value[product.id] = 1
  }
}

function startImageRotation(productId: number, fotos: any[]) {
  if (!fotos || fotos.length <= 1 || intervalMap.value[productId]) return

  currentImageIndexMap.value[productId] = 0

  intervalMap.value[productId] = setInterval(() => {
    const total = fotos.length
    currentImageIndexMap.value[productId] =
      (currentImageIndexMap.value[productId] + 1) % total
  }, 3000)
}

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
        <!-- IMPLEMENTAR O EFEITO QUE INDICA CARREGANDO BONITO EM BREVE -->
        <!-- <div v-if="loading" class="text-gray-400">Carregando produtos...</div> -->
        <div v-if="error" class="text-red-500">Erro: {{ error }}</div>
        <div v-else-if="data.length === 0 && loaded" class="text-gray-500">Nenhum produto encontrado.</div>
        <div v-else>
          <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            <router-link
  v-for="product in data"
  :key="product.id"
  :to="`/produto/${product.id}`"
>
  <CardProduto :product="product" />
</router-link>



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
