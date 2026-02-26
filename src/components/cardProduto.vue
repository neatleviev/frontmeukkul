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
    <!-- preço -->
    <div class="absolute top-1 left-0 select-none price-badge-wrapper">
        <div class=" flex flex-col items-end px-2 py-1 rounded-xl">
          <span class="price-premium" style="
            background: linear-gradient(180deg, #34C759 0%, #30B350 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            font-weight: 800;
          ">R$ {{ (product.preco ?? 0).toFixed(2) }}</span>
        </div>
      </div>

      <!-- Ícone de fogo (colocado no canto superior direito da imagem) -->
      <span class="image-flame select-none" aria-hidden="true">🥳</span>
    <div
      class="relative  w-full h-60 overflow-hidden  bg-white rounded-xl"
      v-if="product.fotos?.length"
    >

      <img
        v-for="(foto, i) in product.fotos"
        :key="i"
        :src="foto.url"
        :alt="foto.name"
        class="absolute inset-0 w-full h-60 object-contain transition-opacity duration-700 ease-out"
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
      class="product-title text-lg font-semibold mb-1 leading-tight flex items-center gap-2 select-none"
    >
      <span class="name bg-clip-text  text-zinc-950">
        {{ product.nome || 'Sem nome' }}
      </span>
    </h2>

    <slot name="top" />

    <div class="text-sm text-gray-700 mt-2 md:mt-3 flex flex-col gap-1 md:gap-2 mt-auto" @click.stop>
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
        <div class="flex flex-col md:flex-row justify-between items-stretch md:items-center mt-2 gap-2 md:gap-4">
        <!-- select quantidade - em mobile fica acima do botão, em desktop ao lado -->
        <div class="quantity-selector flex items-center justify-between w-full md:w-fit rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-white order-1 md:order-2">
          <button
            @click.stop="diminuirQuantidade"
            class="quantity-btn flex-1 md:flex-none md:w-10 h-10 md:h-9 flex items-center justify-center text-lg font-medium hover:bg-gray-100 active:scale-95 transition cursor-pointer disabled:opacity-50"
          >
            −
          </button>

          <span class="flex-1 md:flex-none md:w-12 text-center text-base font-semibold select-none">
            {{ quantidade }}
          </span>

          <button
            @click.stop="aumentarQuantidade"
            class="quantity-btn flex-1 md:flex-none md:w-10 h-10 md:h-9 flex items-center justify-center text-lg font-medium hover:bg-gray-100 active:scale-95 transition cursor-pointer disabled:opacity-50"
            :disabled="quantidade >= estoqueDisponivel"
          >
            +
          </button>
        </div>

        <button
          @click.stop="adicionarNaSacola"
          class="text-sm font-bold px-5 py-2.5 rounded-xl cursor-pointer transition-all duration-300 active:scale-95 iphone-btn order-2 md:order-1"
          :disabled="estoqueDisponivel <= 0"
        >
          <span class="iphone-btn-text">{{ estoqueDisponivel <= 0 ? 'Tudo adicionado' : 'Pegar agora' }}</span>
        </button>
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
import { ref, onMounted, onBeforeUnmount, computed, reactive } from 'vue'
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


// --- INÍCIO: lógica dinâmica para detectar keys de opção ---
const optionKeys = computed(() => {
  const variantes = props.product?.variantes ?? []   // se seu prop for outro nome, ajuste aqui
  const keysSet = new Set<string>()

  const ignorarList = [
    'id', '_id', 'sku', 'preco', 'price', 'precoPromocional', 'estoque',
    'estoqueVariante', 'estoqueUnico', 'quantidade', 'ticket', 'ticketPai',
    'createdAt', 'updatedAt', '__v', 'imagem', 'fotos', 'url'
  ]

  for (const v of variantes) {
    if (!v || typeof v !== 'object') continue
    for (const k of Object.keys(v)) {
      if (ignorarList.includes(k)) continue
      const val = v[k]
      if (val === null || val === undefined) continue
      if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        if (String(val).trim() === '') continue
        keysSet.add(k)
      }
    }
  }

  return Array.from(keysSet)
})
// --- FIM: optionKeys ---



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

  const preferidas = ['tamanho', 'cor', 'time', 'times', 'team', 'aroma', 'funcao']

  const ignorar = new Set([
    'id', '_id', 'sku', 'preco', 'price', 'precoPromocional', 'estoque',
    'estoqueVariante', 'estoqueUnico', 'quantidade', 'ticket', 'ticketPai',
    'createdAt', 'updatedAt', '__v', 'imagem', 'fotos', 'url'
  ])

  const partes: string[] = []

  const keysFromOptions = (optionKeys && optionKeys.value && optionKeys.value.length)
    ? optionKeys.value
    : []

  // 1) Preferidas
  for (const k of preferidas) {
    const val = v[k]
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      partes.push(String(val).trim())
    }
  }

  // 2) Keys detectadas dinamicamente
  for (const k of keysFromOptions) {
    if (preferidas.includes(k)) continue
    if (ignorar.has(k)) continue
    const val = v[k]
    if (val === undefined || val === null) continue
    const s = String(val).trim()
    if (s === '') continue
    partes.push(s)
  }

  // 3) Outras chaves restantes (ordenadas)
  Object.keys(v)
    .sort()
    .forEach((k) => {
      if (preferidas.includes(k)) return
      if (keysFromOptions.includes(k)) return
      if (ignorar.has(k)) return
      const val = v[k]
      if (val === undefined || val === null) return
      const s = String(val).trim()
      if (s === '') return
      partes.push(s)
    })

  return partes.join(' | ').replace(/\s\|\s(\s\|\s)*$/,'')
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
  const varianteLimpa = variante ? (() => {
  const clean: Record<string, any> = {}
  for (const k of Object.keys(variante)) {
    const v = variante[k]
    if (v === null) continue
    const t = typeof v
    if (t === 'string' || t === 'number' || t === 'boolean') {
      clean[k] = v
    }
  }
  if (!('id' in clean) && variante.id !== undefined) clean.id = variante.id
  if (!('ticket' in clean) && variante.ticket !== undefined) clean.ticket = variante.ticket
  return clean
})() : null

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
  /* borda removida conforme solicitado */
  /* border: 1px solid rgba(0,0,0,0.06); */
  backdrop-filter: blur(6px);
  box-shadow: 0 8px 22px rgba(10,10,10,0.05);
  min-width: 96px;
  text-align: right;
  position: relative; /* allow z-index to take effect */
  z-index: 41;
}


/* Price badge premium - cor sólida, ajuste mobile e leve deslocamento à direita */
.price-premium {
  font-size: 1.25rem;     /* tamanho base para desktop/tablet */
  font-weight: 800;
  
  letter-spacing: -0.3px;
  text-shadow: none;      /* removido shadow para manter cor sólida limpa */
  -webkit-background-clip: initial;
  background-clip: initial;
  background: none;
  display: inline-block;
  transform: translateX(2px); /* pequeno deslocamento para "encostar" mais à direita */
}

/* Ajuste fino para mobile: diminuir tamanho e reduzir deslocamento */
@media (max-width: 640px) {
  .price-premium {
    font-size: 0.95rem;   /* um pouco menor em mobiles */
    transform: translateX(1px);
    white-space: nowrap;  /* evita quebra inesperada do R$ em linhas pequenas */
  }

  
}



/* Ícone de fogo sobre a imagem (canto superior direito) */
.image-flame {
  position: absolute;
  top: 0.25rem; /* top-3 */
  right: 0.25rem; /* right-3 */
  z-index: 42;
  pointer-events: none;
  display: inline-flex;
  transform-origin: 50% 60%;
  font-size: 1.5rem;
  filter: drop-shadow(0 4px 10px rgba(213,106,160,0.08));
  animation: imageFlameFloat 2.6s ease-in-out infinite;
  /* um leve padding para não colar na borda da imagem */
  padding: 2px;
  background: transparent;
  border-radius: 6px;
}

/* movimento do ícone mais sutil */
@keyframes imageFlameFloat {
  0%   { transform: rotate(-3deg) translateY(0); opacity: 1; }
  50%  { transform: rotate(3deg) translateY(-1px); opacity: 0.98; }
  100% { transform: rotate(-3deg) translateY(0); opacity: 1; }
}

/* Efeito 'flamejante' para o nome do produto: brilho rosa por trás das letras (subtil) */
.product-title .name {
  will-change: text-shadow, filter, opacity;
  animation: flameGlow 2.6s ease-in-out infinite;
  /* manter o gradient do texto (já aplicado) */
}

/* animação apenas de brilho / glow por trás das letras — sem movimento de salto */
@keyframes flameGlow {
  0% {
    text-shadow:
      0 0 0 rgba(213,106,160,0.04),
      0 0 0 rgba(244,114,182,0.03),
      0 0 0 rgba(255,200,150,0);
    filter: none;
  }
  30% {
    text-shadow:
      0 2px 6px rgba(213,106,160,0.06),
      0 6px 14px rgba(244,114,182,0.05),
      0 12px 28px rgba(244,114,182,0.02);
    filter: saturate(1.02) blur(0.12px);
  }
  60% {
    text-shadow:
      0 3px 8px rgba(213,106,160,0.08),
      0 9px 20px rgba(244,114,182,0.07),
      0 20px 40px rgba(244,114,182,0.03);
    filter: saturate(1.05) blur(0.18px);
  }
  100% {
    text-shadow:
      0 0 0 rgba(213,106,160,0.04),
      0 0 0 rgba(244,114,182,0.03),
      0 0 0 rgba(255,200,150,0);
    filter: none;
  }
}

/* Bounce ao entrar (mantido apenas para entrada) */
.bounce-in {
  animation: bounceIn 0.7s cubic-bezier(.2, .8, .4, 1) both;
}
/* Bounce ao hover (mantido para outros elementos, não para o nome) */
.group-hover\:animate-bounce-smooth {
  animation: bounceSmooth 0.6s ease-in-out;
}

/* Botão pegar - estilo iPhone verde */
.iphone-btn {
  background: linear-gradient(180deg, #34C759 0%, #30B350 100%);
  border: none;
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.1),
    0 4px 8px rgba(52, 199, 89, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transform-origin: center;
  will-change: transform;
}

.iphone-btn:hover {
  background: linear-gradient(180deg, #36D160 0%, #32BF55 100%);
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.12),
    0 6px 12px rgba(52, 199, 89, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

/* Efeito de ampliação quando o card (li pai) é hover */
.group:hover .iphone-btn {
  transform: scale(1.05);
}

.iphone-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: linear-gradient(180deg, #9CA3AF 0%, #6B7280 100%);
  box-shadow: none;
}

.iphone-btn-text {
  display: inline-block;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.2px;
}

/* Seletor de quantidade - estilo retangular */
.quantity-selector {
  border-radius: 12px;
}

.quantity-btn {
  min-width: 44px;
}

/* Ajustes específicos para mobile */
@media (max-width: 640px) {
  .quantity-selector {
    border-radius: 12px;
    height: 44px;
  }
  
  .quantity-btn {
    min-width: 50px;
    height: 44px;
  }
}

/* borda igual ao card para o controle de quantidade */
.card-border {
  border: 1px solid rgba(0,0,0,0.04) !important;
}

/* Keyframes */
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