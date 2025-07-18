<script setup lang="ts">
import { useProdutoStore } from '@/stores/useProdutoStore'
import { ref, onMounted, watch } from 'vue'
import BotaoVoltar from '@/components/BotaoVoltar.vue'

const produtoStore = useProdutoStore()
const product = ref(produtoStore.produtoSelecionado)
const selectedVariante = ref<any | null>(null)
const isTouchDevice = ref(false)
const dropdownOpen = ref(false)
const error = ref<string | null>(null)
const quantidadeSelecionada = ref<number>(1)
const currentImageIndex = ref(0)
const isMobile = ref(false)
const mostrarDescricao = ref(false)
let imageInterval: any = null

const checkIsMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkIsMobile()
  window.addEventListener('resize', checkIsMobile)

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

  const fotosLength = product.value?.fotos?.length || 0
  if (fotosLength >= 3) {
    imageInterval = setInterval(() => {
      currentImageIndex.value = (currentImageIndex.value + (isMobile.value ? 1 : 2)) % fotosLength
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
  <div v-if="error" class="text-red-500">{{ error }}</div>
  <div v-else-if="product" class="relative">

    <!-- Botão + Título -->
    <div class="flex items-center gap-4 mb-6">
      <BotaoVoltar />
      <h1 class="text-3xl font-bold text-[#d56aa0]">
        <span v-if="product.nome">{{ product.nome }}</span>
      </h1>
    </div>

    <!-- Blocos lado a lado -->
    <div class="flex flex-col md:flex-row gap-6 mb-6">
      
      <!-- BLOCO DE IMAGENS -->
      <div class="relative w-full md:w-[78%] h-80 overflow-hidden flex gap-2">
        <!-- Apenas 1 imagem -->
        <template v-if="product.fotos.length === 1">
          <img
            :src="product.fotos[0].url"
            :alt="product.fotos[0].name"
            class="w-full h-full object-contain rounded transition-opacity duration-1000"
          />
        </template>

        <!-- 2 imagens estáticas -->
        <template v-else-if="product.fotos.length === 2">
          <img
            v-for="(foto, i) in product.fotos"
            :key="i"
            :src="foto.url"
            :alt="foto.name"
            class="w-1/2 h-full object-contain rounded transition-opacity duration-1000"
          />
        </template>

        <!-- 3 ou mais imagens -->
        <template v-else-if="product.fotos.length >= 3">
          <!-- MOBILE: 1 por vez -->
          <img
            v-if="isMobile"
            :src="product.fotos[currentImageIndex % product.fotos.length].url"
            :alt="product.fotos[currentImageIndex % product.fotos.length].name"
            class="w-full h-full object-contain rounded transition-opacity duration-1000"
          />

          <!-- DESKTOP: 2 por vez -->
          <template v-else>
            <img
              v-for="n in 2"
              :key="n"
              :src="product.fotos[(currentImageIndex + n - 1) % product.fotos.length].url"
              :alt="product.fotos[(currentImageIndex + n - 1) % product.fotos.length].name"
              class="w-1/2 h-full object-contain rounded transition-opacity duration-1000"
            />
          </template>
        </template>
      </div>

      <!-- BLOCO DE DETALHES -->
      <div class="w-full md:w-[22%] space-y-4">

        <p class="text-lg font-medium">
          Preço: R$ {{ product.preco?.toFixed(2) }}
        </p>

        <!-- Variações -->
        <div
          v-if="product.variantes && product.variantes.length > 0"
          class="relative w-full max-w-md"
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

        <!-- Quantidade -->
        <div>
          <label class="block mb-1 font-medium">Quantidade selecionada:</label>
          <div class="flex items-center border rounded w-max overflow-hidden">
            <button class="px-3" @click="quantidadeSelecionada > 1 && quantidadeSelecionada--">-</button>
            <span class="px-4">{{ quantidadeSelecionada }}</span>
            <button class="px-3" @click="quantidadeSelecionada++">+</button>
          </div>
        </div>

        <!-- Botão Ver/Ocultar Descrição -->
    <div class="mb-4">
      <button
        @click="mostrarDescricao = !mostrarDescricao"
        class="text-sm text-[#d56aa0] underline hover:text-[#b94e88] transition"
      >
        {{ mostrarDescricao ? 'Ocultar descrição' : 'Ver descrição' }}
      </button>
    </div>

      </div>


    </div>

    

    <!-- Bloco da descrição -->
    <div v-if="mostrarDescricao" class="space-y-2">
      <p
        v-for="(linha, i) in product.descricaoTratada"
        :key="i"
        class="text-gray-800 text-sm"
      >
        {{ linha }}
      </p>
    </div>
  </div>
</template>

<style scoped>
img {
  transition: opacity 1s ease-in-out;
}
</style>
