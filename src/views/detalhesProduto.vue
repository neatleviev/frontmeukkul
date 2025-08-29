<template>
  <div v-if="error" class="text-red-500">{{ error }}</div>
  <div v-else-if="product" class="relative">
    <!-- Botão + Título -->
    <div class="flex items-center gap-4 mb-6">
      <BotaoVoltar />
      <h1 class="text-3xl font-bold text-[#d56aa0] ">
        <span v-if="product.nome">{{ product.nome }}</span>
      </h1>
    </div>

    <!-- Blocos lado a lado -->
    <div class="flex flex-col md:flex-row gap-6 mb-6">
      <!-- BLOCO DE IMAGENS -->
      <div class="relative w-full md:w-[70%] h-80 overflow-hidden flex gap-2 justify-center">
        <template v-if="(product.fotos || []).length === 1">
          <img :src="product.fotos[0].url" :alt="product.fotos[0].name"
               class="w-full h-full object-contain rounded transition-opacity duration-1000" />
        </template>
        <template v-else-if="(product.fotos || []).length === 2">
          <img v-for="(foto, i) in product.fotos" :key="i" :src="foto.url" :alt="foto.name"
               class="w-1/2 h-full object-contain rounded transition-opacity duration-1000" />
        </template>
        <template v-else-if="(product.fotos || []).length >= 3">
          <img v-if="isMobile" :src="product.fotos[currentImageIndex % product.fotos.length].url"
               :alt="product.fotos[currentImageIndex % product.fotos.length].name"
               class="w-full h-full object-contain rounded transition-opacity duration-1000" />
          <template v-else>
            <img v-for="n in 2" :key="n"
                 :src="product.fotos[(currentImageIndex + n - 1) % product.fotos.length].url"
                 :alt="product.fotos[(currentImageIndex + n - 1) % product.fotos.length].name"
                 class="w-1/2 h-full object-contain rounded transition-opacity duration-1000" />
          </template>
        </template>
      </div>

      <!-- BLOCO DE DETALHES -->
      <div class="w-full md:w-[30%] flex flex-col items-center text-center space-y-4">
        <!-- Preço -->
        <p class="text-lg font-medium">
          Preço: <span class="text-gray-800 font-semibold">R$ {{ product.preco?.toFixed(2) }}</span>
        </p>

        <!-- Mensagem impactante sobre a sacola -->
        <p v-if="emSacola > 0" class="text-pink-600 font-semibold text-sm">
          {{ mensagemSacola }}
        </p>

        <!-- Variações -->
        <div v-if="product.variantes && product.variantes.length > 0"
             class="relative w-full max-w-xs dropdown-container"
             @mouseenter="openDropdown"
             @mouseleave="scheduleClose">
          <label class="block mb-1 font-medium">Escolha uma variação:</label>

          <!-- Botão -->
          <button
            class="w-full border rounded-xl px-3 py-2 text-sm bg-white hover:bg-gray-50 flex justify-between items-center"
            @click.stop="isTouchDevice ? (dropdownOpen = !dropdownOpen) : null"
          >
            <span>{{ selectedVariante ? formatarVariante(selectedVariante) : 'Selecione uma variação' }}</span>
            <span class="ml-2">▾</span>
          </button>

          <!-- pequena zona invisível para ajudar a travessia (opcional) -->
          <div v-if="dropdownOpen"
               class="absolute left-0 bottom-full w-full h-2"
               @mouseenter="cancelClose"></div>

          <!-- Dropdown ABRE PARA CIMA -->
          <div v-if="dropdownOpen"
               class="absolute left-0 bottom-full mb-0.5 w-full border rounded-xl bg-white shadow-lg z-50 max-h-48 overflow-y-auto"
               @mouseenter="cancelClose"
               @mouseleave="scheduleClose">
            <div v-for="(v, i) in product.variantes" :key="i"
                 class="px-2 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                 @click.stop="selectedVariante = v; dropdownOpen = false">
              {{ formatarVariante(v) }}
            </div>
          </div>
        </div>

        <!-- Quantidade -->
        <div class="flex items-center gap-3">
          <div class="flex items-center rounded overflow-hidden w-fit shadow bg-white">
            <!-- Botão - -->
            <button
              class="px-3 py-1 text-lg bg-pink-500 text-stone-50 cursor-pointer 
                    hover:scale-120 active:scale-90 
                     transition transform  focus:outline-none"
              @click="diminuirQtd"
              :disabled="estoqueDisponivel <= 0 || quantidadeSelecionada <= minPermitido"
              :class="{ 'opacity-50 cursor-not-allowed': estoqueDisponivel <= 0 || quantidadeSelecionada <= minPermitido }"
              aria-label="Diminuir"
            >
              -
            </button>

            <!-- Input -->
            <input
              type="number"
              :min="minPermitido"
              :max="estoqueDisponivel"
              v-model.number="quantidadeSelecionada"
              class="w-16 text-center py-1 outline-none no-spinner border-0 focus:ring-0"
              :disabled="inputBloqueado"
              @focus="onFocusInput"
              @blur="onBlurInput"
            />

            <!-- Botão + -->
            <button
              class="px-3 py-1 text-lg bg-pink-500 text-stone-50 
                     transition transform  focus:outline-none"
              @click="aumentarQtd"
              :disabled="quantidadeSelecionada >= estoqueDisponivel || estoqueDisponivel <= 0"
              :class="{ 'opacity-50 cursor-not-allowed': quantidadeSelecionada >= estoqueDisponivel || estoqueDisponivel <= 0 }"
              aria-label="Aumentar"
            >
              +
            </button>
          </div>
        </div>

        <!-- Botão "pegar" -->
        <button
          @click="pegarProduto"
          class="w-full bg-pink-500 text-stone-50 py-3 hover:scale-105 active:scale-105
          rounded-2xl text-lg font-semibold cursor-pointer  transition duration-100 ease-in-out
          hover:shadow-[0_0_25px_rgba(213,106,160,0.9)] active:shadow-[0_0_25px_rgba(213,106,160,0.9)]"
          :disabled="estoqueDisponivel <= 0"
        >
          {{ estoqueDisponivel <= 0 ? 'Tudo adicionado' : 'Pegar' }}
        </button>

        <!-- Botão Ver/Ocultar Descrição -->
        <button
          @click="toggleDescricao"
          class="w-full bg-pink-500 text-stone-50 py-3 rounded-2xl  hover:shadow-[0_0_25px_rgba(213,106,160,0.9)] 
          text-lg font-semibold cursor-pointer  hover:scale-105 transition duration-100 ease-in-out
         active:scale-105 active:shadow-[0_0_25px_rgba(213,106,160,0.9)]"
        >
          {{ mostrarDescricao ? 'Ocultar descrição' : 'Ver descrição' }}
        </button>
      </div>
    </div>

    <!-- Descrição abaixo do bloco pai -->
    <div v-if="mostrarDescricao" class="mt-6 border-t border-gray-200 pt-4">
      <div v-if="carregandoDescricao" class="text-gray-500 text-sm">Carregando descrição...</div>
      <div v-else>
        <template v-if="product.descricaoTratada && product.descricaoTratada.length">
          <p v-for="(linha, i) in product.descricaoTratada" :key="i"
             class="text-gray-800 text-sm leading-relaxed mb-2">
            {{ linha }}
          </p>
        </template>
        <p v-else class="text-gray-500 italic text-sm">Nenhuma descrição disponível.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, computed } from 'vue'
import { useProdutoStore } from '@/stores/useProdutoStore'
import { useSacolaStore } from '@/stores/useSacolaStore'
import BotaoVoltar from '@/components/BotaoVoltar.vue'
import { buscarProdutoPorTicketPai } from '@/services/strapi'

const produtoStore = useProdutoStore()
const sacolaStore = useSacolaStore()

const product = ref<any>(produtoStore.produtoSelecionado)
const selectedVariante = ref<any | null>(null)
const isTouchDevice = ref(false)
const dropdownOpen = ref(false)
const error = ref<string | null>(null)

/** Quantidade pode ser 0 quando não há estoque disponível */
const quantidadeSelecionada = ref<number>(1)

const currentImageIndex = ref(0)
const isMobile = ref(false)
const mostrarDescricao = ref(false)
const carregandoDescricao = ref(false)

// controle anti-fechamento precoce (pequeno delay)
const closeTimer = ref<number | null>(null)
const OPEN_CLOSE_DELAY = 120

let imageInterval: any = null

function getDescricaoLinesFromObject(obj: any): string[] {
  if (!obj) return []
  if (typeof obj === 'string') {
    return obj.trim().split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean)
  }
  const descCandidate = obj.descricao ?? (obj.attributes && obj.attributes.descricao) ?? null
  if (!descCandidate) return []
  if (typeof descCandidate === 'string') {
    return descCandidate.trim().split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean)
  }
  if (Array.isArray(descCandidate)) {
    const lines: string[] = []
    for (const node of descCandidate) {
      let text = ''
      if (node == null) continue
      if (typeof node === 'string') text = node
      else if (Array.isArray(node.children)) {
        text = node.children.map((c: any) => {
          if (typeof c === 'string') return c
          if (typeof c.text === 'string') return c.text
          if (Array.isArray(c.children)) {
            return c.children.map((cc: any) => (typeof cc.text === 'string' ? cc.text : '')).join('')
          }
          return ''
        }).join('')
      } else if (typeof node.text === 'string') {
        text = node.text
      }
      const t = (text || '').trim()
      if (t) lines.push(t)
    }
    return lines
  }
  return []
}

/* ====== Funções que usam o serviço (definidas como const para o TS) ====== */
const carregarDescricao = async (): Promise<void> => {
  try {
    if (product.value?.descricaoTratada?.length) return
    const localLines = getDescricaoLinesFromObject(product.value)
    if (localLines.length) {
      product.value.descricaoTratada = localLines
      produtoStore.setProdutoSelecionado(product.value)
      return
    }
    const ticketCandidates = [
      product.value?.ticketPai,
      product.value?.ticket,
      product.value?.attributes?.ticketPai,
      selectedVariante.value?.ticketPai,
      selectedVariante.value?.ticket
    ].filter(Boolean)
    const ticket = ticketCandidates[0]
    if (!ticket) {
      product.value.descricaoTratada = []
      produtoStore.setProdutoSelecionado(product.value)
      return
    }
    carregandoDescricao.value = true
    const produtoApi = await buscarProdutoPorTicketPai(Number(ticket))
    const apiLines = getDescricaoLinesFromObject(produtoApi?.attributes ?? produtoApi)
    if (!apiLines.length) {
      product.value.descricaoTratada = []
      produtoStore.setProdutoSelecionado(product.value)
      return
    }
    product.value.descricaoTratada = apiLines
    product.value.descricao = apiLines.join('\n\n')
    produtoStore.setProdutoSelecionado(product.value)
  } catch (err) {
    product.value.descricaoTratada = []
    produtoStore.setProdutoSelecionado(product.value)
  } finally {
    carregandoDescricao.value = false
  }
}

const ensureFullProductIfNeeded = async (): Promise<void> => {
  try {
    if (!product.value) return
    const hasFotos = Array.isArray(product.value?.fotos) && product.value.fotos.length > 0
    const hasDescricao = getDescricaoLinesFromObject(product.value).length > 0
    const hasVariantes = Array.isArray(product.value?.variantes) && product.value.variantes.length > 0
    if (hasFotos && hasDescricao && hasVariantes) return
    const ticket = product.value?.ticketPai || product.value?.ticket
    if (!ticket) return
    const produtoApi = await buscarProdutoPorTicketPai(Number(ticket))
    if (!produtoApi) return
    const attrs = produtoApi.attributes ?? produtoApi
    const normalized = { ...product.value, id: produtoApi.id ?? product.value.id, ...attrs }
    const apiLines = getDescricaoLinesFromObject(attrs)
    if (apiLines.length) normalized.descricaoTratada = apiLines
    product.value = normalized
    produtoStore.setProdutoSelecionado(product.value)
  } catch {}
}

/* ====== Toggle descricao (usado no template) ====== */
const toggleDescricao = () => {
  mostrarDescricao.value = !mostrarDescricao.value
  if (mostrarDescricao.value && (!product.value?.descricaoTratada || !product.value?.descricaoTratada.length)) {
    carregarDescricao()
  }
}

/* ====== ESTOQUES ====== */
const estoqueTotal = computed(() => {
  return product.value?.variantes?.length
    ? selectedVariante.value?.estoqueVariante || 0
    : product.value?.estoqueUnico || 0
})

const emSacola = computed(() => {
  const item = sacolaStore.itens.find((item: any) =>
    item.id === product.value?.id &&
    (!product.value?.variantes?.length || item.selectedVariante?.id === selectedVariante.value?.id)
  )
  return item?.quantidadeSelecionada || 0
})

const estoqueDisponivel = computed(() => Math.max(0, estoqueTotal.value - emSacola.value))

/* ====== MENSAGEM IMPACTANTE ====== */
const mensagemSacola = computed(() => {
  if (emSacola.value === 1) {
    return "💖 Perfeito — já tem 1 unidade deste produto na sua sacola!"
  }
  return `💖 Maravilha — sua sacola já contém ${emSacola.value} unidades deste produto!`
})

/* ====== REGRAS DE INPUT ====== */
const inputBloqueado = computed(() => {
  return estoqueDisponivel.value <= 0 || quantidadeSelecionada.value >= estoqueDisponivel.value
})
const minPermitido = computed(() => (estoqueDisponivel.value <= 0 ? 0 : 1))

/* ====== FORMATA VARIANTE ====== */
function formatarVariante(v: any): string {
  if (!v) return ''
  return `${v.tamanho || ''} | ${v.cor || ''} | ${v.aroma || ''} | ${v.funcao || ''} - Estoque: ${v.estoqueVariante}`
}

/* ====== CONTROLES DE QUANTIDADE ====== */
function onFocusInput(e: FocusEvent) {
  const el = e.target as HTMLInputElement
  if (!inputBloqueado.value) el.select()
}
function onBlurInput() {
  const max = estoqueDisponivel.value
  let corrigida = quantidadeSelecionada.value
  if (max <= 0) corrigida = 0
  else {
    if (!corrigida || corrigida < 1) corrigida = 1
    if (corrigida > max) corrigida = max
  }
  if (corrigida !== quantidadeSelecionada.value) quantidadeSelecionada.value = corrigida
}

function diminuirQtd() {
  const min = minPermitido.value
  quantidadeSelecionada.value = Math.max(min, (quantidadeSelecionada.value || min) - 1)
}
function aumentarQtd() {
  const max = estoqueDisponivel.value
  const atual = quantidadeSelecionada.value || 0
  quantidadeSelecionada.value = Math.min(max, atual + 1)
}

/* Evita loops: só corrige quando realmente muda */
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
    localStorage.setItem('produtoSelecionado', JSON.stringify(product.value))
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
    if (quantidadeSelecionada.value < 1 || quantidadeSelecionada.value > max) {
      quantidadeSelecionada.value = 1
    }
  }
})

/* ====== PEGAR PRODUTO ======
   - Se a quantidade selecionada for >= estoque disponível, adiciona TUDO.
   - Após adicionar: força 0 quando não restar nada; caso ainda reste, força 1.
*/
function pegarProduto() {
  const produtoClonado = JSON.parse(JSON.stringify(product.value))
  const variante = selectedVariante.value
  const varianteLimpa = variante ? {
    id: variante.id, tamanho: variante.tamanho, cor: variante.cor,
    aroma: variante.aroma, funcao: variante.funcao,
    estoqueVariante: variante.estoqueVariante, ticket: variante.ticket
  } : null

  const max = estoqueDisponivel.value
  const qtdSolicitada = Math.min(Math.max(quantidadeSelecionada.value || 0, 0), max)

  if (qtdSolicitada <= 0) return

  const produtoSacola = {
    ...produtoClonado,
    selectedVariante: varianteLimpa,
    quantidadeSelecionada: qtdSolicitada
  }

  // adiciona no store
  sacolaStore.adicionarProduto(produtoSacola)

  // após atualizar a sacola, o estoqueDisponivel reativo muda.
  // Se zerou, força 0; senão, força 1 (há pelo menos 1 unidade ainda livre).
  setTimeout(() => {
    quantidadeSelecionada.value = estoqueDisponivel.value > 0 ? 1 : 0
  }, 0)
}

/** ---------- Controle de hover com delay ---------- */
function cancelClose() {
  if (closeTimer.value) {
    clearTimeout(closeTimer.value)
    closeTimer.value = null
  }
}
function scheduleClose() {
  cancelClose()
  closeTimer.value = window.setTimeout(() => {
    dropdownOpen.value = false
  }, OPEN_CLOSE_DELAY)
}
function openDropdown() {
  cancelClose()
  dropdownOpen.value = true
}

/* ====== LIFECYCLE ====== */
const checkIsMobile = () => { isMobile.value = window.innerWidth < 768 }
const checkAndSetDefaultQty = () => {
  quantidadeSelecionada.value = estoqueDisponivel.value > 0 ? 1 : 0
}

onMounted(() => {
  checkIsMobile()
  window.addEventListener('resize', checkIsMobile)
  const saved = localStorage.getItem('produtoSelecionado')
  if (!product.value && saved) product.value = JSON.parse(saved)
  if (product.value?.selectedVariante) selectedVariante.value = product.value.selectedVariante

  // define default com base no estoque atual (1 ou 0)
  checkAndSetDefaultQty()

  if (!product.value) error.value = 'Produto não carregado.'
  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  ensureFullProductIfNeeded().then(() => { if (mostrarDescricao.value) carregarDescricao() }).catch(() => {})

  const fotosLength = (product.value?.fotos?.length) || 0
  if (fotosLength >= 3) {
    imageInterval = setInterval(() => {
      currentImageIndex.value = (currentImageIndex.value + (isMobile.value ? 1 : 2)) % fotosLength
    }, 3000)
  }
})

onBeforeUnmount(() => {
  if (imageInterval) clearInterval(imageInterval)
  if (closeTimer.value) clearTimeout(closeTimer.value)
  window.removeEventListener('resize', checkIsMobile)
})
</script>

<style scoped>
img { transition: opacity 1s ease-in-out; }

/* Remove as setas do input number */
.no-spinner::-webkit-inner-spin-button,
.no-spinner::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.no-spinner {
  -moz-appearance: textfield; /* Firefox */
  appearance: textfield;      /* padrão */
}
</style>
