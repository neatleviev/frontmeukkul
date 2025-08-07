<template>
  <li
    @mouseenter="inicializarQuantidadeUnica(product)"
    @click="navegarParaDetalhes"
    class="cursor-pointer p-4 border rounded bg-white hover:shadow transition relative flex flex-col h-full"
  >
    <div class="absolute top-2 right-2" v-if="$slots.badge">
      <slot name="badge" />
    </div>

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

    <h2 class="text-lg font-semibold text-[#d56aa0] mb-2">
      {{ product.nome || 'Sem nome' }}
    </h2>
    <p class="text-sm text-gray-600">
      Preço: R$ {{ product.preco?.toFixed(2) || 'N/A' }}
    </p>

    <slot name="top" />

    <div class="text-sm text-gray-600 mt-4 flex flex-col gap-2 mt-auto" @click.stop>
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

      <template v-if="(product.variantes?.length && selectedVariante) || (!product.variantes?.length && product.estoqueUnico)">
        <div class="flex justify-between items-center mt-2">
          <button
            @click.stop="adicionarNaSacola"
            class="text-[#d56aa0] text-sm font-medium hover:underline"
            :disabled="estoqueDisponivel <= 0"
          >
            {{ estoqueDisponivel <= 0 ? 'Tudo adicionado' : 'pegar' }}
          </button>

          <div class="flex items-center border rounded overflow-hidden">
            <button @click.stop="diminuirQuantidade" class="px-3">-</button>
            <span class="px-4">{{ quantidade }}</span>
            <button @click.stop="aumentarQuantidade" class="px-3" :disabled="quantidade >= estoqueDisponivel">+</button>
          </div>
        </div>
        <span v-if="estoqueDisponivel <= 0" class="text-red-500 text-xs">Todas as unidades disponíveis já estão na sacola.</span>
      </template>

      <template v-else-if="!product.variantes?.length && !product.estoqueUnico">
        <span class="text-gray-500">Produto sem estoque</span>
      </template>
    </div>

    <slot name="footer" />
  </li>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProdutoStore } from '@/stores/useProdutoStore'
import { useSacolaStore } from '@/stores/useSacolaStore'

const props = defineProps<{ product: any }>()
const router = useRouter()
const produtoStore = useProdutoStore()
const sacolaStore = useSacolaStore()

const dropdownVisible = ref(false)
const closeTimer = ref<number | null>(null)
const selectedVariante = ref<any>(null)
const quantidade = ref(0)
const currentImageIndex = ref(0)
let interval: any = null

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

const emSacola = computed(() => {
  const item = sacolaStore.itens.find((item: any) =>
    item.id === props.product.id &&
    (!props.product.variantes?.length || item.selectedVariante?.id === selectedVariante.value?.id)
  )
  return item?.quantidadeSelecionada || 0
})

const estoqueTotal = computed(() => {
  return props.product.variantes?.length
    ? selectedVariante.value?.estoqueVariante || 0
    : props.product.estoqueUnico || 0
})

const estoqueDisponivel = computed(() => {
  return estoqueTotal.value - emSacola.value
})

function formatarVariante(v: any): string {
  if (!v) return ''
  return `${v.tamanho || ''} | ${v.cor || ''} | ${v.aroma || ''} | ${v.funcao || ''}`
}

function selectVariante(variante: any) {
  selectedVariante.value = variante
  quantidade.value = estoqueDisponivel.value > 0 ? 1 : 0
  const produtoComVariante = {
    ...props.product,
    selectedVariante: variante,
    quantidadeSelecionada: quantidade.value
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
  if (quantidade.value < estoqueDisponivel.value) {
    quantidade.value++
  }
}

function diminuirQuantidade() {
  if (quantidade.value > 1) quantidade.value--
}

function inicializarQuantidadeUnica(product: any) {
  if (
    !product.variantes?.length &&
    product.estoqueUnico &&
    quantidade.value < 1 &&
    estoqueDisponivel.value > 0
  ) {
    quantidade.value = 1
  }
}

function adicionarNaSacola() {
  if (quantidade.value > estoqueDisponivel.value) {
    alert(`Você só pode adicionar até ${estoqueDisponivel.value} unidades deste produto.`)
    quantidade.value = estoqueDisponivel.value > 0 ? 1 : 0
    return
  }

  const produtoClonado = JSON.parse(JSON.stringify(props.product))
  const variante = selectedVariante.value
  const varianteLimpa = variante
    ? {
        id: variante.id,
        tamanho: variante.tamanho,
        cor: variante.cor,
        aroma: variante.aroma,
        funcao: variante.funcao,
        estoqueVariante: variante.estoqueVariante,
        ticket: variante.ticket
      }
    : null
    const produtoSacola = {
      ...produtoClonado,
      selectedVariante: varianteLimpa,
      quantidadeSelecionada: quantidade.value
    }
    console.log("Produto sendo adicionado à sacola:", produtoSacola)

  sacolaStore.adicionarProduto(produtoSacola)
  quantidade.value = estoqueDisponivel.value - quantidade.value > 0 ? 1 : 0
}

function navegarParaDetalhes() {
  produtoStore.setProdutoSelecionado(props.product)
  localStorage.setItem('produtoSelecionado', JSON.stringify(props.product))
  router.push(`/produto/${props.product.ticketPai}`)
}

onMounted(() => {
  const fotos = props.product?.fotos
  if (fotos?.length > 1) {
    interval = setInterval(() => {
      currentImageIndex.value = (currentImageIndex.value + 1) % fotos.length
    }, 3000)
  }

  if (!props.product.variantes?.length && props.product.estoqueUnico) {
    const itemNaSacola = sacolaStore.itens.find((item: any) => item.id === props.product.id)
    const emSacola = itemNaSacola?.quantidadeSelecionada || 0
    const disponivel = (props.product.estoqueUnico || 0) - emSacola
    quantidade.value = disponivel > 0 ? 1 : 0
  }
})

onBeforeUnmount(() => {
  if (interval) clearInterval(interval)
})
</script>
