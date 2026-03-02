<template>
  <div v-if="error" class="text-red-500">{{ error }}</div>
  <div v-else-if="product" class="relative">
    <!-- Botão + Título -->
    <div class="flex items-center gap-4 mb-1">
      <BotaoVoltar />
      <h1 class="tituloEstilo leading-tight mt-2">
        <span v-if="product.nome">{{ product.nome }}</span>
      </h1>
    </div>

    <!-- Blocos lado a lado -->
    <div class="flex flex-col md:flex-row gap-2 ">

     <!-- BLOCO DE IMAGENS (mostrar 1 ou 2 imagens por vez) -->
<div class="bg-black/5 rounded-3xl p-2 flex justify-center items-center min-h-[260px] md:min-h-[420px] md:w-1/2">
  <div class="relative w-full overflow-hidden">
    <!-- BOTÃO ANTERIOR -->
    <button
      @click="prevImage"
      class="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 z-10"
      aria-label="Imagem anterior"
      type="button"
    >
      ◀
    </button>

    <!-- IMAGENS / CARROSSEL -->
    <div
      class="flex gap-2 justify-center items-center"
      @mousedown="startDrag"
      @touchstart="startDrag"
    >
      <img
        v-for="(img, i) in imagensVisiveis"
        :key="i"
        :src="img"
        alt="Imagem do produto"
        class="rounded-xl object-cover w-full md:w-1/2 max-h-[420px]"
      />
    </div>

    <!-- BOTÃO PRÓXIMO -->
    <button
      @click="nextImage"
      class="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 z-10"
      aria-label="Próxima imagem"
      type="button"
    >
      ▶
    </button>

    <!-- INDICADOR (opcional) -->
    <div class="flex justify-center gap-1 mt-2">
      <span
        v-for="(img, idx) in imagens"
        :key="idx"
        class="w-2 h-2 rounded-full"
        :class="idx === currentImageIndex ? 'bg-black' : 'bg-black/20'"
      ></span>
    </div>
  </div>
</div>

      <!-- BLOCO DE DETALHES -->
      <div class="bg-black/5 rounded-3xl p-4 md:w-1/2 flex flex-col justify-between gap-4">

        <!-- PREÇO -->
        <div class="text-2xl font-bold">
          <span v-if="selectedVariante">{{ formatMoney(selectedVariante.preco) }}</span>
          <span v-else>{{ formatMoney(product.preco) }}</span>
        </div>

        <!-- VARIANTES -->
        <div v-if="variantesDisponiveis.length">
          <p class="font-semibold mb-2">Selecione:</p>

          <!-- DROPDOWN -->
          <div
            class="relative"
            @mouseenter="openDropdown"
            @mouseleave="scheduleCloseDropdown"
          >
            <button
              type="button"
              class="w-full bg-white rounded-2xl px-4 py-3 flex justify-between items-center shadow-sm"
              @click="toggleDropdown"
            >
              <span>
                {{ selectedVariante ? selectedVariante.nome : 'Escolha uma opção' }}
              </span>
              <span>▼</span>
            </button>

            <div
              v-if="dropdownOpen"
              class="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg z-20 max-h-64 overflow-auto"
              @mouseenter="cancelCloseDropdown"
              @mouseleave="scheduleCloseDropdown"
            >
              <button
                v-for="v in variantesDisponiveis"
                :key="v.id"
                type="button"
                class="w-full text-left px-4 py-3 hover:bg-black/5"
                @click="selectVariante(v)"
              >
                {{ v.nome }}
              </button>
            </div>
          </div>

          <p v-if="selectedVariante" class="text-sm mt-2 opacity-70">
            Estoque: {{ estoqueDisponivel }}
          </p>
        </div>

        <!-- QUANTIDADE -->
        <div class="flex items-center gap-2">
          <p class="font-semibold">Quantidade:</p>

          <div class="flex items-center gap-2 bg-white rounded-2xl px-3 py-2 shadow-sm">
            <button type="button" class="px-3 py-1" @click="decrement">-</button>
            <span class="min-w-[24px] text-center">{{ quantidadeSelecionada }}</span>
            <button type="button" class="px-3 py-1" @click="increment">+</button>
          </div>

          <p class="text-sm opacity-70" v-if="estoqueDisponivel <= 0">Indisponível</p>
        </div>

        <!-- BOTÃO ADICIONAR -->
        <button
          type="button"
          class="bg-black text-white rounded-2xl py-3 font-semibold shadow-md disabled:opacity-50"
          :disabled="!podeAdicionar"
          @click="adicionarNaSacola"
        >
          Adicionar ao carrinho
        </button>

        <!-- DESCRIÇÃO -->
        <div class="mt-2">
          <button
            type="button"
            class="font-semibold underline"
            @click="toggleDescricao"
          >
            {{ mostrarDescricao ? 'Ocultar descrição' : 'Ver descrição' }}
          </button>

          <div v-if="mostrarDescricao" class="mt-2 text-sm whitespace-pre-line">
            <div v-if="carregandoDescricao" class="opacity-70">Carregando descrição...</div>
            <div v-else>
              <div v-if="descricaoLines.length">
                <p v-for="(line, idx) in descricaoLines" :key="idx">{{ line }}</p>
              </div>
              <div v-else class="opacity-70">Sem descrição disponível.</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, computed, reactive } from 'vue'
import { useProdutoStore } from '@/stores/useProdutoStore'
import { useSacolaStore } from '@/stores/useSacolaStore'
import BotaoVoltar from '@/components/BotaoVoltar.vue'
import { buscarProdutoPorTicketPai } from '@/services/strapi'

const produtoStore = useProdutoStore()
const sacolaStore = useSacolaStore()

const product = ref<any>(null)
const selectedVariante = ref<any | null>(null)
const isTouchDevice = ref(false)
const dropdownOpen = ref(false)
const error = ref<string | null>(null)

// id vindo da rota: /produto/:id (router está com props: true)
const props = defineProps<{ id: string }>()

/** Quantidade pode ser 0 quando não há estoque disponível */
const quantidadeSelecionada = ref<number>(1)





// --- INÍCIO: Drag / Swipe support (adicionar) ---
const isDragging = ref(false)
const dragStartX = ref(0)
const dragCurrentX = ref(0)
const dragThreshold = 50 // pixels necessários para considerar um swipe

function getEventX(e: any) {
  if (!e) return 0
  if (e.touches && e.touches.length) return e.touches[0].clientX
  if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientX
  return e.clientX ?? 0
}

function startDrag(e: any) {
  // evita que o click padrão e seleção atuem
  isDragging.value = true
  dragStartX.value = getEventX(e)
  dragCurrentX.value = dragStartX.value

  // Adiciona listeners globais para garantir captura do mouse quando fora do elemento
  document.addEventListener('mousemove', onDragging)
  document.addEventListener('mouseup', endDrag)
  document.addEventListener('touchmove', onDragging, { passive: false })
  document.addEventListener('touchend', endDrag)
}

function onDragging(e: any) {
  if (!isDragging.value) return
  const x = getEventX(e)
  dragCurrentX.value = x
  // opcional: podemos usar dragCurrentX - dragStartX para efeitos visuais (não implementado aqui)
  // se quisermos prevenir o scroll durante o arrasto horizontal:
  const delta = Math.abs(dragCurrentX.value - dragStartX.value)
  if (e.type?.startsWith('touch') && delta > 10) {
    // impede scroll vertical enquanto o usuário está claramente arrastando horizontalmente
    e.preventDefault?.()
  }
}

function endDrag() {
  if (!isDragging.value) return
  isDragging.value = false

  const deltaX = dragCurrentX.value - dragStartX.value
  if (Math.abs(deltaX) >= dragThreshold) {
    if (deltaX < 0) nextImage()
    else prevImage()
  }

  // Remove listeners globais
  document.removeEventListener('mousemove', onDragging)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', onDragging as any)
  document.removeEventListener('touchend', endDrag as any)
}
// --- FIM: Drag / Swipe support ---

const mostrarDescricao = ref(false)
const descricaoLines = ref<string[]>([])
const carregandoDescricao = ref(false)

const closeTimer = ref<number | null>(null)

const variantesDisponiveis = computed(() => {
  const v = product.value?.variantes
  if (!Array.isArray(v)) return []
  // filtra apenas variantes com nome/id
  return v.filter((x: any) => x && (x.nome || x.name || x.id))
})

const estoqueDisponivel = computed(() => {
  // Se tiver variante selecionada, usa estoque dela; senão usa estoque do produto
  const estoqueVar = selectedVariante.value?.estoqueVariante ?? selectedVariante.value?.estoque ?? null
  const estoqueProd = product.value?.estoqueUnico ?? product.value?.estoque ?? null
  const raw = estoqueVar !== null && estoqueVar !== undefined ? estoqueVar : estoqueProd
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
})

const podeAdicionar = computed(() => {
  // Precisa ter estoque e quantidade > 0
  if (estoqueDisponivel.value <= 0) return false
  if (quantidadeSelecionada.value <= 0) return false

  // Se existem variantes, exige seleção
  if (variantesDisponiveis.value.length && !selectedVariante.value) return false
  return true
})

const imagens = computed(() => {
  // tenta usar product.imagens (array), senão tenta cair em campos comuns
  const imgs = product.value?.imagens
  if (Array.isArray(imgs) && imgs.length) return imgs

  const url1 = product.value?.imagem1
  const url2 = product.value?.imagem2
  const url3 = product.value?.imagem3

  const list = [url1, url2, url3].filter(Boolean)
  return list.length ? list : []
})

const currentImageIndex = ref(0)

const imagensVisiveis = computed(() => {
  const imgs = imagens.value
  if (!imgs.length) return []
  // Em desktop, mostrar 2 imagens; no mobile, mostrar 1
  const count = isTouchDevice.value ? 1 : 2
  const vis: string[] = []
  for (let i = 0; i < count; i++) {
    const idx = (currentImageIndex.value + i) % imgs.length
    vis.push(imgs[idx])
  }
  return vis
})

function nextImage() {
  const imgs = imagens.value
  if (!imgs.length) return
  currentImageIndex.value = (currentImageIndex.value + 1) % imgs.length
}

function prevImage() {
  const imgs = imagens.value
  if (!imgs.length) return
  currentImageIndex.value = (currentImageIndex.value - 1 + imgs.length) % imgs.length
}

function formatMoney(value: any) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 'R$ 0,00'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function openDropdown() {
  if (isTouchDevice.value) return
  dropdownOpen.value = true
}

function toggleDropdown() {
  // no touch (mobile), abre/fecha por click
  dropdownOpen.value = !dropdownOpen.value
}

function scheduleCloseDropdown() {
  if (isTouchDevice.value) return
  cancelCloseDropdown()
  closeTimer.value = window.setTimeout(() => {
    dropdownOpen.value = false
  }, 150)
}

function cancelCloseDropdown() {
  if (closeTimer.value) {
    clearTimeout(closeTimer.value)
    closeTimer.value = null
  }
}

function selectVariante(v: any) {
  selectedVariante.value = v
  dropdownOpen.value = false
  // ao mudar variante, reajusta quantidade default
  checkAndSetDefaultQty()
}

function increment() {
  const max = estoqueDisponivel.value
  if (max <= 0) {
    quantidadeSelecionada.value = 0
    return
  }
  if (quantidadeSelecionada.value < max) quantidadeSelecionada.value++
}

function decrement() {
  const max = estoqueDisponivel.value
  if (max <= 0) {
    quantidadeSelecionada.value = 0
    return
  }
  if (quantidadeSelecionada.value > 1) quantidadeSelecionada.value--
}

function adicionarNaSacola() {
  if (!podeAdicionar.value) return

  const item = {
    ...product.value,
    selectedVariante: selectedVariante.value,
    quantidadeSelecionada: quantidadeSelecionada.value
  }

  sacolaStore.adicionarProduto(item)
}

function toggleDescricao() {
  mostrarDescricao.value = !mostrarDescricao.value
  if (mostrarDescricao.value) carregarDescricao()
}

function getDescricaoLinesFromObject(obj: any): string[] {
  if (!obj) return []
  const raw =
    obj.descricao ??
    obj.description ??
    obj.descricaoCompleta ??
    obj.descricaoCurta ??
    ''
  if (!raw) return []
  return String(raw)
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
}

async function carregarDescricao() {
  try {
    if (!product.value) return
    const ticket = product.value?.ticketPai || product.value?.ticket
    if (!ticket) {
      descricaoLines.value = getDescricaoLinesFromObject(product.value)
      return
    }
    carregandoDescricao.value = true
    const produtoApi = await buscarProdutoPorTicketPai(Number(ticket))
    const apiLines = getDescricaoLinesFromObject(produtoApi?.attributes ?? produtoApi)
    // se a API vier vazia, usa o que já tem
    descricaoLines.value = apiLines.length ? apiLines : getDescricaoLinesFromObject(product.value)
  } finally {
    carregandoDescricao.value = false
  }
}

const ensureFullProductIfNeeded = async (): Promise<void> => {
  try {
    if (!product.value) return
    const hasFotos = Array.isArray(product.value?.imagens) && product.value.imagens.length > 0
    const hasDescricao = Boolean(getDescricaoLinesFromObject(product.value).length)
    const hasVariantes = Array.isArray(product.value?.variantes) && product.value.variantes.length > 0
    if (hasFotos && hasDescricao && hasVariantes) return

    const ticket = product.value?.ticketPai || product.value?.ticket
    if (!ticket) return

    const produtoApi = await buscarProdutoPorTicketPai(Number(ticket))
    if (!produtoApi) return

    const attrs = produtoApi.attributes ?? produtoApi
    // mescla mantendo seleções locais
    const keepSelected = selectedVariante.value
    product.value = { ...(product.value || {}), ...(attrs || {}), id: produtoApi.id ?? product.value?.id }
    if (keepSelected) selectedVariante.value = keepSelected
  } catch (e) {
    // silencioso: não travar a tela
  }
}

/* Quando trocar quantidade, limitar ao estoque e garantir default (1 ou 0) */
watch(quantidadeSelecionada, (nova) => {
  const max = estoqueDisponivel.value
  let corrigida = nova
  if (max <= 0) corrigida = 0
  else {
    if (!corrigida || corrigida < 1) corrigida = 1
    if (corrigida > max) corrigida = max
  }
  if (corrigida !== nova) {
    quantidadeSelecionada.value = corrigida
    return
  }
  if (product.value) {
    product.value.quantidadeSelecionada = quantidadeSelecionada.value
  }
})

/* Quando trocar variante ou mudar estoque, definir default correto:
   - 1 quando existe pelo menos 1 unidade disponível
   - 0 quando não há disponibilidade
*/
watch([selectedVariante, estoqueDisponivel], () => {
  const max = estoqueDisponivel.value
  if (max <= 0) {
    if (quantidadeSelecionada.value !== 0) quantidadeSelecionada.value = 0
  } else {
    if (!quantidadeSelecionada.value || quantidadeSelecionada.value < 1) quantidadeSelecionada.value = 1
    if (quantidadeSelecionada.value > max) quantidadeSelecionada.value = max
  }
})

function checkAndSetDefaultQty() {
  const max = estoqueDisponivel.value
  if (max <= 0) {
    quantidadeSelecionada.value = 0
  } else {
    // default 1, respeitando limite
    if (!quantidadeSelecionada.value || quantidadeSelecionada.value < 1) quantidadeSelecionada.value = 1
    if (quantidadeSelecionada.value > max) quantidadeSelecionada.value = max
  }
}

// Detecta mobile para 1 imagem por vez
function checkIsMobile() {
  // você pode ajustar o breakpoint
  const mobile = window.innerWidth < 768
  // se for mobile, consideramos touch para exibir 1 imagem
  isTouchDevice.value = mobile || 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/** Suporte a teclado: setas esquerda/direita */
function onKeyDown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement | null)?.tagName
  const active = document.activeElement as any
  const isEditable = active?.isContentEditable ?? false
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || isEditable) return

  if (e.key === 'ArrowLeft') {
    prevImage()
    e.preventDefault()
  } else if (e.key === 'ArrowRight') {
    nextImage()
    e.preventDefault()
  }
}

// =========================================================
// Carregar SEMPRE pelo id da rota (/produto/:id)
// =========================================================
async function loadProdutoByRouteId(id: string) {
  try {
    error.value = null
    product.value = null
    selectedVariante.value = null

    const numericId = Number(id)
    if (!numericId || Number.isNaN(numericId)) {
      error.value = 'Link de produto inválido.'
      return
    }

    // No seu projeto, o :id da rota é tratado como ticketPai
    const produtoApi: any = await buscarProdutoPorTicketPai(numericId)
    if (!produtoApi) {
      error.value = 'Produto não encontrado.'
      return
    }

    const attrs = produtoApi.attributes ?? produtoApi
    product.value = { id: produtoApi.id ?? numericId, ...attrs }

    // Se houver variante previamente marcada (caso API/store retorne), respeita
    if (product.value?.selectedVariante) selectedVariante.value = product.value.selectedVariante

    // define default com base no estoque atual (1 ou 0)
    checkAndSetDefaultQty()

    // Preenche dados faltantes (imagens/descrição/variantes) se necessário
    await ensureFullProductIfNeeded()

    // Atualiza store para outras telas (sem persistência)
    produtoStore.setProdutoSelecionado(product.value)

    // Se descrição estiver aberta, recarrega
    if (mostrarDescricao.value) carregarDescricao()
  } catch (e) {
    error.value = 'Não foi possível carregar o produto.'
  }
}

watch(
  () => props.id,
  (id) => {
    if (!id) return
    loadProdutoByRouteId(id)
  },
  { immediate: true }
)

onMounted(() => {
  checkIsMobile()
  window.addEventListener('resize', checkIsMobile)

  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  // *** Suporte a teclado: setas esquerda/direita ***
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  // Se você tinha timers de fechamento (closeTimer), mantém
  if (closeTimer.value) clearTimeout(closeTimer.value)
  window.removeEventListener('resize', checkIsMobile)

  // remover listener do teclado
  window.removeEventListener('keydown', onKeyDown)

  // limpeza dos listeners globais de arrasto (caso ainda estejam ativos)
  document.removeEventListener('mousemove', onDragging)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', onDragging as any)
  document.removeEventListener('touchend', endDrag as any)
})
</script>