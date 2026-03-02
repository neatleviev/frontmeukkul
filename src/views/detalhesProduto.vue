<template>
  <div v-if="carregandoProduto">Carregando...</div>
  <div v-else-if="error" class="text-red-500">{{ error }}</div>
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
<div class="relative w-full md:w-[70%] mb-2 flex flex-col gap-1 items-center">
  <!-- Imagem(s) principal(is) -->
  <!-- INÍCIO: CONTAINER PRINCIPAL DE IMAGENS (SUBSTITUIR) -->
<div
  class="relative w-full h-full flex items-center justify-center bg-white rounded gap-2 p-2"
  :class="{ 'cursor-grab': !isDragging, 'cursor-grabbing': isDragging }"
  style="touch-action: pan-y;" 
  @mousedown.prevent="startDrag"
  @touchstart="startDrag"
  @mousemove.prevent="onDragging"
  @touchmove="onDragging"
  @mouseup.prevent="endDrag"
  @mouseleave="endDrag"
  @touchend="endDrag"
>
  <template v-if="product?.fotos && product.fotos.length">
    <!-- displayCount será 1 ou 2 (computada no script) -->
    <div
      v-for="i in displayCount"
      :key="`main-${(currentImageIndex + (i-1)) % product.fotos.length}`"
      class="flex-1 h-full flex items-center justify-center"
      style="min-width: 0;"
    >
      <img
        :src="product.fotos[(currentImageIndex + (i-1)) % product.fotos.length].url"
        :alt="product.fotos[(currentImageIndex + (i-1)) % product.fotos.length].name || 'foto produto'"
        class="w-full h-full object-contain rounded transition-opacity duration-300"
      />
    </div>
  </template>

  <!-- Botão Anterior (oculto em mobile) -->
  <button
    @click="prevImage"
    class="hidden md:block absolute left-2 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/80 shadow hover:bg-white"
    aria-label="Imagem anterior"
  >
    ‹
  </button>

  <!-- Botão Próximo (oculto em mobile) -->
  <button
    @click="nextImage"
    class="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/80 shadow hover:bg-white"
    aria-label="Próxima imagem"
  >
    ›
  </button>
</div>
<!-- FIM: CONTAINER PRINCIPAL DE IMAGENS -->


 <!-- INÍCIO: Thumbnails (corrigido: largura limitada + centralizadas + mobile scrollável) -->
<div
  v-if="product?.fotos && product.fotos.length > 1"
  class="w-full flex justify-center "
  @touchstart.stop
  @mousedown.stop
  role="tablist"
  aria-label="Miniaturas"
>
  <!-- Thumbnails -->
<div
  v-if="product?.fotos && product.fotos.length > 1"
  class="w-full flex justify-center"
  @touchstart.stop
  @mousedown.stop
  role="tablist"
  aria-label="Miniaturas"
>
  <div
    ref="thumbsEl"
    class="flex gap-2 overflow-x-auto no-scrollbar pb-1 flex-nowrap md:justify-center"
    style="max-width: 100%;"
    :class="{'cursor-grab': !thumbIsDragging, 'cursor-grabbing': thumbIsDragging}"
    @mousedown.prevent="startThumbDrag"
    @touchstart="startThumbDrag"
    @mousemove.prevent="onThumbDragging"
    @touchmove="onThumbDragging"
    @mouseup.prevent="endThumbDrag"
    @mouseleave="endThumbDrag"
    @touchend="endThumbDrag"
  >
    <!-- aqui ficam os botões das miniaturas -->
    <button
      v-for="(f, idx) in product.fotos"
      :key="f.url + '-' + idx"
      @click="goToImage(Number(idx))"
      :aria-label="`Ir para imagem ${Number(idx) + 1}`"
      :class="[
        'flex items-center justify-center rounded border bg-white transition-all duration-200 hover:opacity-80',
        { 'ring-2 ring-offset-1 ring-[#d56aa0]': isIndexVisible(Number(idx)) }
      ]"
      style="flex: 0 0 auto;"
    >
      <img
        :src="f.url"
        :alt="f.name || `miniatura ${Number(idx) + 1}`"
        class="object-contain rounded"
        :class="['w-16 h-16 md:w-20 md:h-10']"
        draggable="false"
      />
    </button>

  </div>
</div>

</div>
<!-- FIM: Thumbnails -->



</div>

      <!-- BLOCO DE DETALHES -->
      <div class="w-full md:w-[30%] flex flex-col items-center text-center space-y-4">
        <!-- Preço -->
       <p class="estiloPrice font-medium">
        <span class="rounded-xl">R$ {{ product.preco?.toFixed(2) }}</span>
      </p>

        <!-- Mensagem impactante sobre a sacola -->
        <p v-if="emSacola > 0" class="text-pink-600 font-semibold text-sm">
          {{ mensagemSacola }}
        </p>

        <!-- Variações -->
        <!-- === INÍCIO: Substituir bloco "Variações" existente por este (sem mensagem de combinação) === -->
<div v-if="product.variantes && product.variantes.length > 0" class="w-full max-w-xs">
  <label class="block mb-1 font-medium">Escolha as opções:</label>

  <!-- Para cada chave de opção (ex: time, aroma, tamanho) criamos um select -->
  <div v-for="(key, idx) in optionKeys" :key="key" class="mb-3">
    <label class="block text-xs text-gray-600 mb-1 capitalize">{{ key }}:</label>
    <select
      v-model="selectedOptions[key]"
      class="w-full border rounded-xl px-3 py-2 text-sm bg-white"
      @change="onOptionChange"
    >
      <option :value="null">— Selecione {{ key }} —</option>
      <option v-for="val in optionValues(key)" :key="val" :value="val">
        {{ val }}
      </option>
    </select>
  </div>

  <!-- Mensagem de combinação removida conforme solicitado -->
</div>
<!-- === FIM: Substituir bloco "Variações" === -->




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
              class="px-3 py-1 text-lg bg-pink-500 text-stone-50 cursor-pointer 
                    hover:scale-120 active:scale-90 
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
  rounded-2xl text-lg font-semibold cursor-pointer transition duration-100 ease-in-out
  hover:shadow-[0_0_25px_rgba(213,106,160,0.9)] active:shadow-[0_0_25px_rgba(213,106,160,0.9)]"
  :disabled="estoqueDisponivel <= 0 || !allOptionsSelected"
>
  {{ buttonLabel }}
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
    <div v-if="mostrarDescricao" class=" border-t border-gray-200 pt-4 p-10 ">
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
import { ref, onMounted, watch, onBeforeUnmount, computed,reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useProdutoStore } from '@/stores/useProdutoStore'
import { useSacolaStore } from '@/stores/useSacolaStore'
import BotaoVoltar from '@/components/BotaoVoltar.vue'
import { buscarProdutoPorTicketPai } from '@/services/strapi'

const produtoStore = useProdutoStore()
const sacolaStore = useSacolaStore()
const route = useRoute()

const product = ref<any>(null)
const selectedVariante = ref<any | null>(null)
const isTouchDevice = ref(false)
const dropdownOpen = ref(false)
const error = ref<string | null>(null)
const carregandoProduto = ref(false)

/** Quantidade pode ser 0 quando não há estoque disponível */
const quantidadeSelecionada = ref<number>(1)




// --- INÍCIO: Drag / Swipe support (adicionar) ---
import { ref as vueRef } from 'vue' // caso já tenha ref importado, ignore esta linha

const isDragging = ref(false)
const dragStartX = ref(0)
const dragCurrentX = ref(0)
const dragThreshold = 50 // pixels necessários para considerar um swipe


const dragStartY = ref(0)
const dragCurrentY = ref(0)


async function carregarProduto() {
  carregandoProduto.value = true
  error.value = null
  product.value = null

  try {
    const id = Number(route.params.id)

    if (!id) {
      error.value = 'Link inválido.'
      return
    }

    // tenta pegar do cache
    const cached = produtoStore.getProduto(id)
    if (cached) {
      product.value = cached
      return
    }

    const produtoApi = await buscarProdutoPorTicketPai(id)
    if (!produtoApi) {
      error.value = 'Produto não encontrado.'
      return
    }

    const attrs = produtoApi.attributes ?? produtoApi
    const normalized = { id: produtoApi.id ?? id, ...attrs }

    product.value = normalized
    produtoStore.setProduto(normalized)
  } catch (e) {
    error.value = 'Produto não encontrado.'
  } finally {
    carregandoProduto.value = false
  }
}


function getEventX(e: any) {
  if (!e) return 0
  if (e.touches && e.touches.length) return e.touches[0].clientX
  if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientX
  return e.clientX ?? 0
}

function getEventY(e: any) {
  if (!e) return 0
  if (e.touches && e.touches.length) return e.touches[0].clientY
  if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientY
  return e.clientY ?? 0
}

function startDrag(e: any) {
  // evita que o click padrão e seleção atuem
  isDragging.value = true
  dragStartX.value = getEventX(e)
  dragCurrentX.value = dragStartX.value

  dragStartY.value = getEventY(e)
  dragCurrentY.value = dragStartY.value

  // Adiciona listeners globais para garantir captura do mouse quando fora do elemento
  document.addEventListener('mousemove', onDragging)
  document.addEventListener('mouseup', endDrag)
  document.addEventListener('touchmove', onDragging, { passive: false })
  document.addEventListener('touchend', endDrag)
}

function onDragging(e: any) {
  if (!isDragging.value) return

  const x = getEventX(e)
  const y = getEventY(e)

  dragCurrentX.value = x
  dragCurrentY.value = y

  const dx = dragCurrentX.value - dragStartX.value
  const dy = dragCurrentY.value - dragStartY.value

  // Só bloqueia o scroll quando o gesto for claramente horizontal
  if (e.type?.startsWith('touch')) {
    const absX = Math.abs(dx)
    const absY = Math.abs(dy)

    if (absX > 10 && absX > absY) {
      if (e.cancelable) e.preventDefault()
    }
  }
}

function endDrag(e: any) {
  if (!isDragging.value) return
  isDragging.value = false
  dragCurrentX.value = getEventX(e)
  const delta = dragCurrentX.value - dragStartX.value

  // remover listeners globais adicionados em startDrag
  document.removeEventListener('mousemove', onDragging)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', onDragging)
  document.removeEventListener('touchend', endDrag)

  if (Math.abs(delta) >= dragThreshold) {
    if (delta < 0) {
      // movimento para esquerda => próxima imagem
      nextImage()
    } else {
      // movimento para direita => imagem anterior
      prevImage()
    }
  } else {
    // Se necessário, podemos tratar como click (já existe @click nos thumbs). Aqui não fazemos nada.
  }

  // reset valores
  dragStartX.value = 0
  dragCurrentX.value = 0

  dragStartY.value = 0
  dragCurrentY.value = 0
}
// --- FIM: Drag / Swipe support ---



// 👉 Cole aqui:
const thumbsEl = ref<HTMLElement | null>(null)

const thumbIsDragging = ref(false)
const thumbStartX = ref(0)
const thumbStartY = ref(0) 
const thumbStartScroll = ref(0)
const THUMB_DRAG_PASSIVE = { passive: false }

function startThumbDrag(e: any) {
  thumbIsDragging.value = true
  thumbStartX.value = getEventX(e)
  thumbStartY.value = getEventY(e)
  thumbStartScroll.value = thumbsEl.value ? thumbsEl.value.scrollLeft : 0

  document.addEventListener('mousemove', onThumbDragging)
  document.addEventListener('mouseup', endThumbDrag)
  document.addEventListener('touchmove', onThumbDragging, THUMB_DRAG_PASSIVE)
  document.addEventListener('touchend', endThumbDrag)
}

function onThumbDragging(e: any) {
  if (!thumbIsDragging.value || !thumbsEl.value) return

  const x = getEventX(e)
  const y = getEventY(e)

  const dx = x - thumbStartX.value
  const dy = y - thumbStartY.value

  thumbsEl.value.scrollLeft = thumbStartScroll.value - dx

  // Só impede o scroll vertical quando o gesto for claramente horizontal
  if (e.type?.startsWith('touch')) {
    const absX = Math.abs(dx)
    const absY = Math.abs(dy)

    if (absX > 10 && absX > absY) {
      if (e.cancelable) e.preventDefault()
    }
  }
}
function endThumbDrag(e: any) {
  if (!thumbIsDragging.value) return
  thumbIsDragging.value = false
  document.removeEventListener('mousemove', onThumbDragging)
  document.removeEventListener('mouseup', endThumbDrag)
  document.removeEventListener('touchmove', onThumbDragging)
  document.removeEventListener('touchend', endThumbDrag)
  thumbStartX.value = 0
  thumbStartScroll.value = 0
}




// === CONTROLES DE IMAGEM (1 ou 2 por vez) ===
// índice da primeira imagem do par atual
const currentImageIndex = ref(0) // já existe no seu arquivo; se duplicar, ignore esta linha

// quantas imagens exibimos por vez: 2 quando há >=2 fotos, senão 1
const displayCount = computed(() => {
  const len = (product.value?.fotos?.length) || 0
  return len >= 2 ? 2 : 1
})

// helper: número de fotos disponíveis
function fotosLength() {
  return (product.value?.fotos?.length) || 0
}

// indica se determinada thumbnail (idx) está visível no par atual
function isIndexVisible(idx: number) {
  const len = fotosLength()
  if (!len) return false
  for (let i = 0; i < displayCount.value; i++) {
    if (((currentImageIndex.value + i) % len) === idx) return true
  }
  return false
}

// normaliza índice para [0, len-1]
function normalizeIndex(idx: number) {
  const len = fotosLength()
  if (!len) return 0
  return ((idx % len) + len) % len
}

// Avança para o próximo "slot" (pula displayCount posições)
function nextImage() {
  const len = fotosLength()
  if (!len) return
  const step = displayCount.value
  currentImageIndex.value = normalizeIndex(currentImageIndex.value + step)
}

// Vai para o anterior (pula displayCount posições para trás)
function prevImage() {
  const len = fotosLength()
  if (!len) return
  const step = displayCount.value
  currentImageIndex.value = normalizeIndex(currentImageIndex.value - step)
}

// Vai diretamente para a imagem clicada nas thumbnails
function goToImage(idx: number) {
  const len = fotosLength()
  if (!len) return
  currentImageIndex.value = normalizeIndex(idx)
}





const isMobile = ref(false)
const mostrarDescricao = ref(false)
const carregandoDescricao = ref(false)

// controle anti-fechamento precoce (pequeno delay)
const closeTimer = ref<number | null>(null)
const OPEN_CLOSE_DELAY = 120



/** Reatividade das opções selecionadas: { time: 'flamengo', aroma: 'chocolate', ... } */
const selectedOptions = reactive<Record<string, string | null>>({})

/** Variant resolved: encontrada a variante que bate com as opções selecionadas */
const resolvedVariant = ref<any | null>(null)

/** Retorna chaves de opção detectadas nas variantes (ordem previsível) */
const optionKeys = computed(() => {
  const variantes = product?.value?.variantes ?? []
  const keysSet = new Set<string>()
  for (const v of variantes) {
    // percorre todas as props e adiciona as que parecem ser atributos
    if (v && typeof v === 'object') {
      for (const k of Object.keys(v)) {
        // pular campos já conhecidos que NÃO são atributos (ajuste conforme seu modelo)
        // pular campos já conhecidos que NÃO são atributos (ajuste conforme seu modelo)
if (['id', 'sku', 'preco', 'price', 'estoque', 'estoqueVariante', 'quantidade', 'ticket', 'ticketPai'].includes(k)) continue

        // também pule campos que contenham nested objects/arrays
        const val = v[k]
        if (val === null) continue
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
          keysSet.add(k)
        }
      }
    }
  }
  return Array.from(keysSet)
})


/** Verifica se todas as opções (selects) foram escolhidas.
 *  Retorna true automaticamente quando não existem keys (produto sem variantes).
 */
const allOptionsSelected = computed(() => {
  // se não houver selects (produto sem variantes), não exige seleção
  if (!optionKeys.value || optionKeys.value.length === 0) return true
  // exige que TODOS os selects tenham valor truthy
  return optionKeys.value.every(key => !!selectedOptions[key])
})

/** Retorna true se pelo menos UMA opção foi escolhida (usado para detectar "nada selecionado") */
const anyOptionSelected = computed(() => {
  if (!optionKeys.value || optionKeys.value.length === 0) return false
  return optionKeys.value.some(key => !!selectedOptions[key])
})


/** Label do botão baseado nas regras pedidas:
 * - se houver selects e nenhuma seleção -> "Nada selecionado :("
 * - se existir seleção(s) mas estoque == 0 -> "Produto esgotado"
 * - se existir seleção(s) incompletas -> "Selecione todas as opções"
 * - caso tudo OK -> "Pegar"
 * - produtos sem variantes seguem normalmente (dependem só do estoque).
 */
const buttonLabel = computed(() => {
  // Há selects no produto?
  const hasSelects = optionKeys.value && optionKeys.value.length > 0

  // Caso: existem selects e nenhuma seleção foi feita
  if (hasSelects && !anyOptionSelected.value) return 'Nada selecionado 😢'

  // Caso: estoque indisponível (independente de selects)
  if (estoqueDisponivel.value <= 0) return 'Produto esgotado'

  // Caso: existem selects, mas nem todas selecionadas
  if (hasSelects && !allOptionsSelected.value) return 'Selecione todas as opções'

  // Caso: tudo ok
  return 'Pegar'
})




/** Dado um key, retorna os valores únicos ordenados para popular o select */
function optionValues(key: string): Array<string> {
  const variantes = product?.value?.variantes ?? []
  const set = new Set<string>()
  for (const v of variantes) {
    if (!v) continue
    const raw = v[key]
    if (raw === undefined || raw === null) continue
    set.add(String(raw))
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}

/** Inicializa selectedOptions com null para todas as keys detectadas */
function initSelectedOptions() {
  optionKeys.value.forEach(k => {
    // só define se não existir para não sobrescrever escolha do usuário se já houver
    if (!(k in selectedOptions)) selectedOptions[k] = null
  })
}

/** Retorna a variante que possui todos os pares chave:valor iguais ao selectedOptions.
 * Se algum selectedOptions[k] for null -> ignora esse par (não exige).
 */
function findVariantByOptions(): any | null {
  const variantes = product?.value?.variantes ?? []
  // Se não houver opções selecionadas, não resolvemos automaticamente (opcional).
  const keys = optionKeys.value
  // Se nenhum valor foi escolhido, não resolvemos
  const anyChosen = keys.some(k => !!selectedOptions[k])
  if (!anyChosen) return null

  for (const v of variantes) {
    let ok = true
    for (const k of keys) {
      const chosen = selectedOptions[k]
      if (chosen == null) continue // não exige
      const variantVal = v[k]
      // comparar strings/case-insensitive
      if (variantVal === undefined || variantVal === null) {
        ok = false
        break
      }
      if (String(variantVal).toLowerCase() !== String(chosen).toLowerCase()) {
        ok = false
        break
      }
    }
    if (ok) return v
  }
  return null
}

/** Chamado quando qualquer select muda (pode também ser usado para tracking) */
function onOptionChange() {
  resolvedVariant.value = findVariantByOptions()
  // Atualiza selectedVariante global (mantendo compatibilidade com o resto do código)
  selectedVariante.value = resolvedVariant.value  
}
/* === FIM: variáveis e funções a adicionar === */




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
      produtoStore.setProduto(product.value)
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
      produtoStore.setProduto(product.value)
      return
    }
    carregandoDescricao.value = true
    const produtoApi = await buscarProdutoPorTicketPai(Number(ticket))
    const apiLines = getDescricaoLinesFromObject(produtoApi?.attributes ?? produtoApi)
    if (!apiLines.length) {
      product.value.descricaoTratada = []
      produtoStore.setProduto(product.value)
      return
    }
    product.value.descricaoTratada = apiLines
    product.value.descricao = apiLines.join('\n\n')
    produtoStore.setProduto(product.value)
  } catch (err) {
    product.value.descricaoTratada = []
    produtoStore.setProduto(product.value)
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
    produtoStore.setProduto(product.value)
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







// 🧩 Função utilitária para montar campos não vazios
function joinCamposNaoVazios(...campos: Array<string | null | undefined>): string {
  return campos
    .map(c => (typeof c === 'string' ? c.trim() : ''))
    .filter(Boolean)
    .join(' | ')
}

// 🧩 Substituir a função antiga por esta versão
function formatarVariante(v: any): string {
  if (!v) return ''

  // Suportar variações de nome do campo "time"
  const timeVal =
    (typeof v.time === 'string' && v.time) ||
    (typeof v.times === 'string' && v.times) ||
    (typeof v.team === 'string' && v.team) ||
    ''

  const tamanho = (v.tamanho ?? '') as string
  const cor = (v.cor ?? '') as string
  const aroma = (v.aroma ?? '') as string
  const funcao = (v.funcao ?? '') as string

  // Monta o texto com os campos não vazios (ex.: "M | Vermelho")
  const parteInfo = joinCamposNaoVazios(tamanho, cor, aroma, funcao, timeVal)

  // Se não houver informação de atributos, fornecer um fallback legível
  return parteInfo || 'Opção'
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
  const varianteLimpa = variante ? (() => {
  const clean: Record<string, any> = {}
  for (const k of Object.keys(variante)) {
    const v = variante[k]
    // copia somente valores primitivos (evita objetos/arrays complexos)
    if (v === null) continue
    const t = typeof v
    if (t === 'string' || t === 'number' || t === 'boolean') {
      clean[k] = v
    }
  }
  // garantia: preserve id/ticket mesmo que sejam 0/falsy
  if (!('id' in clean) && variante.id !== undefined) clean.id = variante.id
  if (!('ticket' in clean) && variante.ticket !== undefined) clean.ticket = variante.ticket
  return clean
})() : null


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



/* === INÍCIO: Inicialização para ligar os selects às variantes do produto === */
watch(
  () => product.value,
  (novo) => {
    if (!novo) return
    // inicializa keys e selectedOptions
    initSelectedOptions()
    // se houver UMA variante padrão (por ex a primeira), opcionalmente podemos pré-selecionar seus valores:
    // aqui não auto-selecionamos tudo para não forçar escolha do usuário; comente a parte abaixo se quiser
    // if (Array.isArray(novo.variantes) && novo.variantes.length === 1) {
    //   const primeira = novo.variantes[0]
    //   for (const k of optionKeys.value) selectedOptions[k] = primeira[k] ?? null
    //   resolvedVariant.value = primeira
    //   selectedVariante = primeira
    // } else {
      // limpa seleção atual (caso mude de produto)
      for (const k of optionKeys.value) selectedOptions[k] = null
      resolvedVariant.value = null
      selectedVariante.value = null
    // }
  },
  { immediate: true }
)

/* Também observa mudanças nos próprios selectedOptions (reactive) — re-resolve variante. */
watch(
  () => optionKeys.value.map(k => selectedOptions[k]),
  () => {
    resolvedVariant.value = findVariantByOptions()
    selectedVariante.value = resolvedVariant.value
  }
)
/* === FIM: inicialização/watchers === */

// handler do teclado — coloque em escopo superior ao onMounted/onBeforeUnmount
function onKeyDown(e: KeyboardEvent) {
  // não reagir se o usuário estiver digitando em um input/textarea/select ou em elemento contentEditable
  const active = document.activeElement as HTMLElement | null
  const tag = active?.tagName ?? ''
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



onMounted(() => {
  carregarProduto()
    .then(() => ensureFullProductIfNeeded())
    .then(() => {
      if (mostrarDescricao.value) carregarDescricao()
    })
    .catch(() => {})

  checkIsMobile()
  window.addEventListener('resize', checkIsMobile)

  if (product.value?.selectedVariante) {
    selectedVariante.value = product.value.selectedVariante
  }

  // define default com base no estoque atual (1 ou 0)
  checkAndSetDefaultQty()

  // ❌ REMOVER ESTA LINHA (não pode mais existir)
  // if (!product.value) error.value = 'Produto não carregado.'

  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  // suporte teclado
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
  document.removeEventListener('touchmove', onDragging)
  document.removeEventListener('touchend', endDrag)
})

watch(
  () => route.params.id,
  () => {
    carregarProduto()
      .then(() => ensureFullProductIfNeeded())
      .then(() => { if (mostrarDescricao.value) carregarDescricao() })
      .catch(() => {})
  },
  { immediate: true }
)

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

/* opcional: melhora visual durante arrasto */
.cursor-grab { cursor: grab; }
.cursor-grabbing { cursor: grabbing; }


.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.estiloPrice {
  font-size: 1.7rem;
  font-weight: 800;
  color: #E2185C;
}

.tituloEstilo {
  font-size: 1.25rem;
  font-weight: 800;
  color: #E2185C;
}

</style>