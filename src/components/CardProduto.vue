<template>
  <li
    @mouseenter="inicializarQuantidadeUnica(product)"
    @click="navegarParaDetalhes"
    class="product-card group cursor-pointer p-3 rounded-2xl
     bg-white shadow-sm hover:shadow-md transition-all duration-300
      relative flex flex-col h-full hover:-translate-y-0.5"
  >
    <div class="absolute top-3 right-3" v-if="$slots.badge">
      <slot name="badge" />
    </div>

    <div
      class="relative w-full h-70 overflow-hidden mb-3 bg-white rounded-xl"
      v-if="product.fotos?.length"
    >
      <!-- Preço em destaque (premium) -->
      <div class="absolute top-3 left-3 select-none price-badge-wrapper">
        <div class="price-badge flex flex-col items-end px-3 py-1 rounded-xl">
          <span class="price-premium">R$ {{ (product.preco ?? 0).toFixed(2) }}</span>
        </div>
      </div>

      <img
        v-for="(foto, i) in product.fotos"
        :key="i"
        :src="foto.url"
        :alt="foto.name"
        class="absolute inset-0 w-full h-70 object-contain transition-opacity duration-700 ease-out"
        :style="{
          opacity: currentImageIndex === i || product.fotos.length === 1 ? 1 : 0,
          zIndex: currentImageIndex === i ? 10 : 0
        }"
        loading="lazy"
        decoding="async"
      />
    </div>

    <!-- Nome com efeito -->
    <h2
      ref="titleEl"
      class="product-title text-lg font-semibold mb-1 leading-tight flex items-center gap-2 select-none
      group-hover:animate-bounce-smooth"
    >
      <span class="flame" aria-hidden="true">🔥</span>
      <span class="name bg-clip-text text-transparent bg-gradient-to-r from-[#d56aa0] to-rose-400">
        {{ product.nome || 'Sem nome' }}
      </span>
    </h2>

    <slot name="top" />

    <div class="text-sm text-gray-700 mt-3 flex flex-col gap-2 mt-auto" @click.stop>
      <template v-if="product.variantes?.length">
        <label class="block font-medium text-gray-800">Variações disponíveis:</label>

        <div
          class="relative"
          @mouseenter="!isTouchDevice && openDropdown()"
          @mouseleave="!isTouchDevice && closeDropdown()"
        >
          <button
            class="w-full border rounded-xl px-3 py-2 text-sm bg-white hover:bg-gray-50 flex justify-between items-center 
            shadow-sm focus:outline-none focus:ring-2 focus:ring-[#d56aa0]/30 transition active:scale-95 cursor-pointer"
            @click.stop="toggleDropdown"
          >
            <span class="truncate">
              {{ selectedVariante ? formatarVariante(selectedVariante) : 'Selecione uma variação' }}
            </span>
            <span class="ml-2 text-gray-500">▾</span>
          </button>

          <div
            v-if="dropdownVisible"
            class="absolute left-0 bottom-full mb-2 w-full border rounded-xl bg-white shadow-xl z-50 max-h-48 overflow-y-auto ring-1 ring-gray-100"
            @mouseenter="onDropdownMouseEnter"
            @mouseleave="closeDropdown"
          >
            <div
              v-for="(v, i) in product.variantes"
              :key="i"
              class="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm transition"
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
            class="text-sm font-medium px-3 py-1.5 rounded cursor-pointer transition active:scale-95 flame-btn"
            :disabled="estoqueDisponivel <= 0"
          >
            <span class="flame-btn-text">{{ estoqueDisponivel <= 0 ? 'Tudo adicionado' : 'pegar' }}</span>
          </button>

          <div class="flex items-center rounded-xl overflow-hidden shadow-sm card-border">
            <button
              @click.stop="diminuirQuantidade"
              class="px-3 py-1 hover:bg-gray-50 transition active:scale-90 cursor-pointer shadow-inner"
            >-</button>
            <span class="px-4 py-1 min-w-8 text-center select-none">{{ quantidade }}</span>
            <button
              @click.stop="aumentarQuantidade"
              class="px-3 py-1 hover:bg-gray-50 transition active:scale-90 cursor-pointer shadow-inner"
              :disabled="quantidade >= estoqueDisponivel"
            >+</button>
          </div>
        </div>
        <span v-if="estoqueDisponivel <= 0" class="text-rose-600 text-xs mt-1">Todas as unidades disponíveis já estão na sacola.</span>
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
  return `${v.tamanho || ''} | ${v.cor || ''} | ${v.aroma || ''} | ${v.funcao || ''}`.replace(/\s\|\s(\s\|\s)*$/,'')
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
  sacolaStore.adicionarProduto(produtoSacola)
  quantidade.value = estoqueDisponivel.value - quantidade.value > 0 ? 1 : 0
}

function navegarParaDetalhes() {
  produtoStore.setProdutoSelecionado(props.product)
  localStorage.setItem('produtoSelecionado', JSON.stringify(props.product))
  router.push(`/produto/${props.product.ticketPai}`)
}

const titleEl = ref<HTMLElement | null>(null)
onMounted(() => {
  const fotos = props.product?.fotos
  if (fotos?.length > 1) {
    interval = setInterval(() => {
      currentImageIndex.value = (currentImageIndex.value + 1) % fotos.length
    }, 3000)
  }

  if (!props.product.variantes?.length && props.product.estoqueUnico) {
    const itemNaSacola = sacolaStore.itens.find((item: any) => item.id === props.product.id)
    const emSacolaQtd = itemNaSacola?.quantidadeSelecionada || 0
    const disponivel = (props.product.estoqueUnico || 0) - emSacolaQtd
    quantidade.value = disponivel > 0 ? 1 : 0
  }

  requestAnimationFrame(() => {
    titleEl.value?.classList.add('bounce-in')
  })
})

onBeforeUnmount(() => {
  if (interval) clearInterval(interval)
})
</script>

<style scoped>
.product-card {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.04);
  transition: all 0.25s ease;
}

/* Price badge premium */
.price-badge-wrapper {
  z-index: 40;
  pointer-events: none; /* let clicks pass through to the card */
}
.price-badge {
  background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.75));
  border: 1px solid rgba(0,0,0,0.06);
  backdrop-filter: blur(6px);
  box-shadow: 0 8px 22px rgba(10,10,10,0.05);
  min-width: 96px;
  text-align: right;
  position: relative; /* allow z-index to take effect */
  z-index: 41;
}
.price-premium {
  font-size: 1.1rem;
  font-weight: 900;
  background: linear-gradient(90deg,#d56aa0,#f472b6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: -0.5px;
  text-shadow: 0 0 12px rgba(213,106,160,0.25);
}

/* 🔥 Fogo mais sutil: inclinar para os lados */
.product-title .flame {
  display: inline-flex;
  font-size: 1em;
  animation: flameDanceSoft 1.8s infinite ease-in-out;
  transform-origin: 50% 60%;
  filter: drop-shadow(0 3px 6px rgba(213,106,160,0.05));
}

/* Nome do produto: sem growPulse (removido) */
.product-title .name {
  will-change: transform;
  animation: none; /* removido o efeito de "aumentar/diminuir" apenas no nome */
}

/* Bounce ao entrar */
.bounce-in {
  animation: bounceIn 0.7s cubic-bezier(.2, .8, .4, 1) both;
}
/* Bounce ao hover */
.group-hover\:animate-bounce-smooth {
  animation: bounceSmooth 0.6s ease-in-out;
}

/* Botão pegar */
.flame-btn {
  background: transparent;
  border: none;
  padding: 0;
}
.flame-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.flame-btn-text {
  display: inline-block;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 700;
  background: linear-gradient(90deg,#d56aa0,#f472b6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 8px rgba(213,106,160,0.28);
  animation: flameTextPulse 1.2s ease-in-out infinite;
}

/* borda igual ao card para o controle de quantidade */
.card-border {
  border: 1px solid rgba(0,0,0,0.04) !important;
}

/* Keyframes */
@keyframes flameDanceSoft {
  0% { transform: rotate(-8deg) translateY(0) scale(1); filter: drop-shadow(0 3px 6px rgba(213,106,160,0.05)); }
  50% { transform: rotate(8deg) translateY(-2px) scale(1.02); filter: drop-shadow(0 4px 10px rgba(213,106,160,0.1)); }
  100% { transform: rotate(-8deg) translateY(0) scale(1); filter: drop-shadow(0 3px 6px rgba(213,106,160,0.05)); }
}

@keyframes flameTextPulse {
  0% { transform: translateY(0) scale(1); opacity: 1; text-shadow: 0 0 6px rgba(213,106,160,0.18); }
  50% { transform: translateY(-2px) scale(1.02); opacity: 0.98; text-shadow: 0 0 14px rgba(213,106,160,0.32); }
  100% { transform: translateY(0) scale(1); opacity: 1; text-shadow: 0 0 6px rgba(213,106,160,0.18); }
}

@keyframes growPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.06); }
  100% { transform: scale(1); }
}

@keyframes bounceIn {
  0% { transform: translateY(25px) scale(.9); opacity: 0; }
  60% { transform: translateY(-8px) scale(1.02); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

@keyframes bounceSmooth {
  0% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
  60% { transform: translateY(3px); }
  100% { transform: translateY(0); }
}
</style>
