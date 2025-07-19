<template>
  <li
    @mouseenter="inicializarQuantidadeUnica(product)"
    @click="navegarParaDetalhes"
    class="cursor-pointer p-4 border rounded bg-white hover:shadow transition relative flex flex-col h-full"
  >
    <!-- Badge (opcional) -->
    <div class="absolute top-2 right-2" v-if="$slots.badge">
      <slot name="badge" />
    </div>

    <!-- Galeria de imagens -->
    <div
      class="relative w-full h-48 overflow-hidden mb-4 bg-white"
      v-if="product.fotos?.length"
    >
      <img
        v-for="(foto, i) in product.fotos"
        :key="i"
        :src="foto.url"
        :alt="foto.name"
        class="absolute top-0 left-0 w-full h-full object-contain rounded transition-opacity duration-1000"
        :style="{
          opacity: currentImageIndex === i || product.fotos.length === 1 ? 1 : 0,
          zIndex: currentImageIndex === i ? 10 : 0
        }"
      />
    </div>

    <h2 class="text-lg font-semibold text-[#d56aa0] mb-2">
      {{ product.nome || 'Sem nome' }}
    </h2>
    <p class="text-sm text-gray-600">
      Preço: R$ {{ product.preco?.toFixed(2) || 'N/A' }}
    </p>

    <!-- Slot customizável acima do botão (opcional) -->
    <slot name="top" />

    <!-- Variações e botão de pegar -->
    <div class="text-sm text-gray-600 mt-4 flex flex-col gap-2 mt-auto">
      <template v-if="product.variantes?.length">
        <label class="block font-medium">Variações disponíveis:</label>
        <div
          class="relative"
          @mouseenter="!isTouchDevice && openDropdown(product.id)"
          @mouseleave="!isTouchDevice && closeDropdown(product.id)"
        >
          <button
            class="w-full border rounded px-2 py-1 text-sm bg-white hover:bg-gray-50 flex justify-between items-center"
            @click.stop="toggleDropdown(product.id)"
          >
            <span>
              {{
                selectedVarianteMap[product.id]
                  ? formatarVariante(selectedVarianteMap[product.id])
                  : 'Selecione uma variação'
              }}
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
      </template>

      <template v-if="(product.variantes?.length && selectedVarianteMap[product.id]) || (!product.variantes?.length && product.estoqueUnico)">
        <div class="flex justify-between items-center mt-2">
          <span class="font-medium text-sm text-[#d56aa0]">pegar</span>
          <div class="flex items-center border rounded overflow-hidden">
            <button @click.stop="diminuirQuantidade(product.id)" class="px-3">-</button>
            <span class="px-4">{{ quantityMap[product.id] || 1 }}</span>
            <button
              @click.stop="aumentarQuantidade(
                product.id,
                product.variantes?.length
                  ? selectedVarianteMap[product.id]?.estoqueVariante || 0
                  : product.estoqueUnico
              )"
              class="px-3"
            >+</button>
          </div>
        </div>
      </template>

      <template v-else-if="!product.variantes?.length && !product.estoqueUnico">
        <span class="text-gray-500">Produto sem estoque</span>
      </template>
    </div>

    <!-- Slot final (footer com botão, promo, etc) -->
    <slot name="footer" />
  </li>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useProdutoStore } from '@/stores/useProdutoStore'

const props = defineProps<{
  product: any
}>()

const produtoStore = useProdutoStore()
const router = useRouter()
const currentImageIndex = ref(0)
let interval: any = null

const selectedVarianteMap = ref<Record<number, any>>({})
const quantityMap = ref<Record<number, number>>({})
const dropdowns = ref<Record<number, boolean>>({})
const closeTimers = ref<Record<number, number>>({})

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

function navegarParaDetalhes() {
  produtoStore.setProdutoSelecionado(props.product)
  localStorage.setItem('produtoSelecionado', JSON.stringify(props.product))
  router.push(`/produto/${props.product.id}`)
}

function formatarVariante(v: any): string {
  if (!v) return ''
  return `${v.tamanho || ''} | ${v.cor || ''} | ${v.aroma || ''} | ${v.funcao || ''}`
}

function aumentarQuantidade(productId: number, max: number) {
  if (quantityMap.value[productId] < max) quantityMap.value[productId]++
}

function diminuirQuantidade(productId: number) {
  if (quantityMap.value[productId] > 1) quantityMap.value[productId]--
}

function inicializarQuantidadeUnica(product: any) {
  if (!product.variantes?.length && product.estoqueUnico && !quantityMap.value[product.id]) {
    quantityMap.value[product.id] = 1
  }
}

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
  localStorage.setItem('produtoSelecionado', JSON.stringify(produtoComVariante))
}

// ✅ Move a rotação da imagem para o ciclo de vida do componente
onMounted(() => {
  const fotos = props.product?.fotos
  if (!fotos || fotos.length <= 1) return

  interval = setInterval(() => {
    currentImageIndex.value = (currentImageIndex.value + 1) % fotos.length
  }, 3000)
})

onBeforeUnmount(() => {
  if (interval) clearInterval(interval)
})
</script>
