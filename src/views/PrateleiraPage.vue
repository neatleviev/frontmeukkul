<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PrateleiraProdutos from '@/components/PrateleiraProdutos.vue'
import { useProdutoStore } from '@/stores/useProdutoStore'

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
  <div class="main-p-4">
    <h1 class="text-3xl font-bold mb-4 text-[#d56aa0] text-center">
      Produtos da Prateleira:
      <span v-if="prateleiraNome">{{ prateleiraNome }}</span>
      <span v-else-if="prateleiraId">ID {{ prateleiraId }}</span>
      <span v-else>Nenhuma Selecionada</span>
    </h1>

    <PrateleiraProdutos :prateleiraId="prateleiraId">
      <template #default="{ loading, error, data, loaded }">
        <div v-if="loading" class="text-gray-400">Carregando produtos...</div>
        <div v-else-if="error" class="text-red-500">Erro: {{ error }}</div>
        <div v-else-if="data.length === 0 && loaded" class="text-gray-500">Nenhum produto encontrado.</div>
        <div v-else>
          <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <router-link
              v-for="product in data"
              :key="product.id"
              :to="`/produto/${product.id}`"
              custom
              v-slot="{ navigate }"
            >
              <li
                @mouseenter="inicializarQuantidadeUnica(product)"
                @click="() => {
                  const varianteSelecionada = selectedVarianteMap[product.id]
                  const quantidade = quantityMap[product.id] || 1

                  const produtoComInfo = {
                    ...product,
                    ...(varianteSelecionada ? { selectedVariante: varianteSelecionada } : {}),
                    quantidadeSelecionada: quantidade
                  }

                  produtoStore.setProdutoSelecionado(produtoComInfo)

                  if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('produtoSelecionado', JSON.stringify(produtoComInfo))
                  }

                  navigate()
                }"
                class="cursor-pointer p-4 border rounded bg-white hover:shadow transition relative"
              >
                <div
                  class="relative w-full h-48 overflow-hidden mb-4 bg-white"
                  @mouseenter="startImageRotation(product.id, product.fotos)"
                >
                  <img
                    v-for="(foto, i) in product.fotos"
                    :key="i"
                    :src="foto.url"
                    :alt="foto.name"
                    class="absolute top-0 left-0 w-full h-full object-contain rounded transition-opacity duration-1000"
                    :style="{
                      opacity: currentImageIndexMap[product.id] === i || product.fotos.length === 1 ? 1 : 0,
                      zIndex: currentImageIndexMap[product.id] === i ? 10 : 0
                    }"
                  />
                </div>

                <h2 class="text-lg font-semibold text-[#d56aa0] mb-2">
                  {{ product.attributes?.nome || product.nome || 'Sem nome' }}
                </h2>
                <p class="text-sm text-gray-600">
                  Preço: R$ {{ product.attributes?.preco || product.preco?.toFixed(2) }}
                </p>

                <!-- Quantidade e Variação -->
                <div class="text-sm text-gray-600">
                  <template v-if="product.variantes?.length">
                    <label class="block mb-1 font-medium">Variações disponíveis:</label>
                    <div class="relative mb-2"
                      @mouseenter="!isTouchDevice && openDropdown(product.id)"
                      @mouseleave="!isTouchDevice && closeDropdown(product.id)">
                      <button
                        class="w-full border rounded px-2 py-1 text-sm bg-white hover:bg-gray-50 flex justify-between items-center"
                        @click.stop="toggleDropdown(product.id)"
                      >
                        <span>
                          {{ selectedVarianteMap[product.id] ? formatarVariante(selectedVarianteMap[product.id]) : 'Selecione uma variação' }}
                        </span>
                        <span class="ml-2">▾</span>
                      </button>

                      <div
                        v-if="dropdowns[product.id]"
                        class="absolute left-0 bottom-full mb-1 w-full border rounded bg-white shadow-lg z-50 max-h-48 overflow-y-auto"
                        @mouseenter="onDropdownMouseEnter(product.id)"
                        @mouseleave="closeDropdown(product.id)"
                      >
                        <div
                          v-for="(v, i) in product.variantes"
                          :key="i"
                          class="px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm"
                          @click.stop="selectVariante(product.id, product, v)"
                        >
                          {{ formatarVariante(v) }}
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center border rounded w-max overflow-hidden">
                      <button @click.stop="diminuirQuantidade(product.id)" class="px-3">-</button>
                      <span class="px-4">{{ quantityMap[product.id] || 0 }}</span>
                      <button @click.stop="aumentarQuantidade(product.id, selectedVarianteMap[product.id]?.estoqueVariante || 0)" class="px-3">+</button>
                    </div>
                  </template>

                  <template v-else-if="product.estoqueUnico && product.estoqueUnico > 0">
                    <label class="block mb-1 font-medium">Quantidade:</label>
                    <div class="flex items-center border rounded w-max overflow-hidden">
                      <button @click.stop="diminuirQuantidade(product.id)" class="px-3">-</button>
                      <span class="px-4">{{ quantityMap[product.id] || 1 }}</span>
                      <button @click.stop="aumentarQuantidade(product.id, product.estoqueUnico)" class="px-3">+</button>
                    </div>
                  </template>

                  <template v-else>
                    <span class="text-gray-500">Produto sem estoque</span>
                  </template>
                </div>
              </li>
            </router-link>
          </ul>
        </div>
      </template>
    </PrateleiraProdutos>
  </div>
</template>

<style scoped>
.main-p-4 {
  padding: 1rem;
}

img {
  transition: opacity 1s ease-in-out;
}
</style>
