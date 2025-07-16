<script setup lang="ts">
import { useProdutoStore } from '@/stores/useProdutoStore'
import { ref, onMounted, watch } from 'vue'

const produtoStore = useProdutoStore()

const product = ref(produtoStore.produtoSelecionado)
const selectedVariante = ref<any | null>(null)
const isTouchDevice = ref(false)
const dropdownOpen = ref(false)
const error = ref<string | null>(null)
const quantidadeSelecionada = ref<number>(1)

const currentImageIndex = ref(0)
let imageInterval: any = null

onMounted(() => {
  const saved = localStorage.getItem('produtoSelecionado')
  if (!product.value && saved) {
    product.value = JSON.parse(saved)
  }

  if (product.value?.selectedVariante) {
    selectedVariante.value = product.value.selectedVariante
  }

  if (product.value?.quantidadeSelecionada) {
    quantidadeSelecionada.value = product.value.quantidadeSelecionada
  }

  if (!product.value) {
    error.value = 'Produto não carregado.'
  }

  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  // Iniciar rotacão das imagens
  if (product.value?.fotos?.length > 1) {
    imageInterval = setInterval(() => {
      currentImageIndex.value = (currentImageIndex.value + 1) % product.value.fotos.length
    }, 3000)
  }
})

watch(quantidadeSelecionada, (novaQtd) => {
  if (product.value) {
    product.value.quantidadeSelecionada = novaQtd
    localStorage.setItem('produtoSelecionado', JSON.stringify(product.value))
  }
})

function formatarVariante(v: any): string {
  if (!v) return ''
  return `${v.tamanho || ''} | ${v.cor || ''} | ${v.aroma || ''} | ${v.funcao || ''} - Estoque: ${v.estoqueVariante}`
}
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div v-if="error" class="text-red-500">{{ error }}</div>

    <div v-else-if="product">
      <h1 class="text-2xl font-bold mb-4">{{ product.nome || 'Sem nome' }}</h1>

      <div class="relative w-full h-80 overflow-hidden mb-4">
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

      <div class="space-y-2 mb-4">
        <p
          v-for="(linha, i) in product.descricaoTratada"
          :key="i"
          class="text-gray-800 text-sm"
        >
          {{ linha }}
        </p>
      </div>

      <p class="text-lg font-medium mb-4">
        Preço: R$ {{ product.preco?.toFixed(2) }}
      </p>

      <div v-if="product.variantes && product.variantes.length > 0" class="relative w-full max-w-sm"
           @mouseenter="!isTouchDevice && (dropdownOpen = true)"
           @mouseleave="!isTouchDevice && (dropdownOpen = false)"
      >
        <label class="block mb-1 font-medium">Escolha uma variação:</label>

        <button
          class="w-full border rounded px-2 py-2 text-sm bg-white hover:bg-gray-50 flex justify-between items-center"
          @click.stop="dropdownOpen = !dropdownOpen"
        >
          <span>
            {{ selectedVariante ? formatarVariante(selectedVariante) : 'Selecione uma variação' }}
          </span>
          <span class="ml-2">▾</span>
        </button>

        <div
          v-if="dropdownOpen"
          class="absolute left-0 bottom-full mb-1 w-full border rounded bg-white shadow-lg z-50 max-h-48 overflow-y-auto"
        >
          <div
            v-for="(v, i) in product.variantes"
            :key="i"
            class="px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm"
            @click.stop="() => { selectedVariante = v; dropdownOpen = false }"
          >
            {{ formatarVariante(v) }}
          </div>
        </div>
      </div>

      <div class="mt-4">
        <label class="block mb-1 font-medium">Quantidade selecionada:</label>
        <div class="flex items-center border rounded w-max overflow-hidden">
          <button class="px-3" @click="quantidadeSelecionada > 1 && quantidadeSelecionada--">-</button>
          <span class="px-4">{{ quantidadeSelecionada }}</span>
          <button class="px-3" @click="quantidadeSelecionada++">+</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
img {
  transition: opacity 1s ease-in-out;
}
</style>
