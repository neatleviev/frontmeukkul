<template>
  <li
    @mouseenter="inicializarQuantidadeUnica(product)"
    @click="navegarParaDetalhes"
    class="cursor-pointer p-4 border rounded bg-white hover:shadow transition relative flex flex-col h-full"
  >
    <!-- Badge opcional -->
    <div class="absolute top-2 right-2" v-if="$slots.badge">
      <slot name="badge" />
    </div>

    <!-- Galeria de imagens -->
    <div class="relative w-full h-48 overflow-hidden mb-4 bg-white" v-if="product.fotos?.length">
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

    <!-- Nome e preço -->
    <h2 class="text-lg font-semibold text-[#d56aa0] mb-2">
      {{ product.nome || 'Sem nome' }}
    </h2>
    <p class="text-sm text-gray-600">
      Preço: R$ {{ product.preco?.toFixed(2) || 'N/A' }}
    </p>

    <!-- Slot opcional acima do botão -->
    <slot name="top" />

    <!-- Variações + Botão -->
    <div class="text-sm text-gray-600 mt-4 flex flex-col gap-2 mt-auto" @click.stop>
      <!-- Dropdown de variantes -->
      <template v-if="product.variantes?.length">
        <label class="block font-medium">Variações disponíveis:</label>
        <div
          class="relative"
          @mouseenter="!isTouchDevice && openDropdown()"
          @mouseleave="!isTouchDevice && closeDropdown()"
        >
          <button
            class="w-full border rounded px-2 py-1 text-sm bg-white hover:bg-gray-50 flex justify-between items-center"
            @click.stop="toggleDropdown"
          >
            <span>
              {{ selectedVariante ? formatarVariante(selectedVariante) : 'Selecione uma variação' }}
            </span>
            <span class="ml-2">▾</span>
          </button>

          <div
            v-if="dropdownVisible"
            class="absolute left-0 bottom-full mb-1 w-full border rounded bg-white shadow-lg z-50 max-h-48 overflow-y-auto"
            @mouseenter="onDropdownMouseEnter"
            @mouseleave="closeDropdown"
          >
            <div
              v-for="(v, i) in product.variantes"
              :key="i"
              class="px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm"
              @click.stop="selectVariante(v)"
            >
              {{ formatarVariante(v) }}
            </div>
          </div>
        </div>
      </template>

      <!-- Botão "pegar" + quantidade -->
      <template v-if="(product.variantes?.length && selectedVariante) || (!product.variantes?.length && product.estoqueUnico)">
        <div class="flex justify-between items-center mt-2">
          <button
            @click.stop="adicionarNaSacola"
            class="text-[#d56aa0] text-sm font-medium hover:underline"
          >
            pegar
          </button>

          <div class="flex items-center border rounded overflow-hidden">
            <button @click.stop="diminuirQuantidade" class="px-3">-</button>
            <span class="px-4">{{ quantidade }}</span>
            <button
              @click.stop="aumentarQuantidade"
              class="px-3"
            >+</button>
          </div>
        </div>
      </template>

      <template v-else-if="!product.variantes?.length && !product.estoqueUnico">
        <span class="text-gray-500">Produto sem estoque</span>
      </template>
    </div>

    <!-- Slot final -->
    <slot name="footer" />
  </li>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useProdutoStore } from '@/stores/useProdutoStore'
import { useSacolaStore } from '@/stores/useSacolaStore'

const props = defineProps<{ product: any }>()

const router = useRouter()
const produtoStore = useProdutoStore()
const sacolaStore = useSacolaStore()

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

// Estados internos
const dropdownVisible = ref(false)
const closeTimer = ref<number | null>(null)
const selectedVariante = ref<any>(null)
const quantidade = ref(1)
const currentImageIndex = ref(0)
let interval: any = null

// Funções
function formatarVariante(v: any): string {
  if (!v) return ''
  return `${v.tamanho || ''} | ${v.cor || ''} | ${v.aroma || ''} | ${v.funcao || ''}`
}

function selectVariante(variante: any) {
  selectedVariante.value = variante
  quantidade.value = 1
  const produtoComVariante = {
    ...props.product,
    selectedVariante: variante,
    quantidadeSelecionada: 1
  }
  produtoStore.setProdutoSelecionado(produtoComVariante)
  localStorage.setItem('produtoSelecionado', JSON.stringify(produtoComVariante))
  dropdownVisible.value = false
}

function toggleDropdown() {
  dropdownVisible.value = !dropdownVisible.value
}

function openDropdown() {
  if (closeTimer.value) clearTimeout(closeTimer.value)
  dropdownVisible.value = true
}

function closeDropdown() {
  closeTimer.value = window.setTimeout(() => {
    dropdownVisible.value = false
  }, 200)
}

function onDropdownMouseEnter() {
  if (closeTimer.value) clearTimeout(closeTimer.value)
}

function aumentarQuantidade() {
  const max = props.product.variantes?.length
    ? selectedVariante.value?.estoqueVariante || 0
    : props.product.estoqueUnico

  if (quantidade.value < max) quantidade.value++
}

function diminuirQuantidade() {
  if (quantidade.value > 1) quantidade.value--
}

function inicializarQuantidadeUnica(product: any) {
  if (!product.variantes?.length && product.estoqueUnico && quantidade.value < 1) {
    quantidade.value = 1
  }
}

function adicionarNaSacola() {
  const produtoSacola = {
    ...props.product,
    selectedVariante: selectedVariante.value,
    quantidadeSelecionada: quantidade.value
  }
  sacolaStore.adicionarProduto(produtoSacola)
}

function navegarParaDetalhes() {
  produtoStore.setProdutoSelecionado(props.product)
  localStorage.setItem('produtoSelecionado', JSON.stringify(props.product))
  router.push(`/produto/${props.product.id}`)
}

// Rotação de imagem automática
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
