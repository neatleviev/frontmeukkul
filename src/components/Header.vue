<template>
  <header class="site-header sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 text-[#d56aa0]">
    <div class="max-w-screen-xl mx-auto px-4 py-3">
      <div class="flex items-center justify-between md:hidden">
        <router-link to="/" class="text-2xl font-extrabold tracking-tight text-[#d56aa0]">meukkul</router-link>

        <div class="flex items-center gap-2" @click="sacolaRef?.abrirSacola()" role="button" aria-label="Abrir sacola">
          <span :key="totalPreco" class="price-loop" aria-live="polite">R$ {{ totalPreco.toFixed(2) }}</span>
          <img src="/money.png" alt="sacola" class="w-10 h-10 icon-click" />
        </div>
      </div>

      <div class="mt-2 md:mt-0 md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:gap-4">
        <div class="hidden md:flex shrink-0 items-center justify-start">
          <router-link to="/" class="text-2xl font-extrabold tracking-tight text-[#d56aa0]">meukkul</router-link>
        </div>

        <div class="relative w-full md:justify-self-center md:flex md:justify-center">
          <div class="nav-wrapper relative w-full max-w-full md:max-w-[68vw] lg:max-w-[58vw]">
            <button
              v-if="showControllers"
              class="controller left-controller hidden md:flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 bg-white p-1 rounded-full shadow-sm z-20"
              @click="scrollByOffset(-scrollStep)"
              aria-label="Anterior"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div
              ref="carouselContainer"
              class="horizontal-scroll flex gap-3 items-center py-1 px-6 rounded-full overflow-x-auto scrollbar-hidden"
              role="list"
              @pointerdown="onPointerDown"
              @pointermove="onPointerMove"
              @pointerup="onPointerUp"
              @pointercancel="onPointerUp"
              @mouseleave="onPointerUpNoEvent"
            >
              <template v-if="vitrines.length > 0">
                <div v-for="vitrine in vitrines" :key="vitrine.id" class="flex-shrink-0">
                  <button
                    class="vitrine-btn whitespace-nowrap bg-white text-[#d56aa0] border border-[#f0cbe0] py-2 px-4 rounded-full cursor-pointer font-semibold transition-shadow active:scale-[0.995]"
                    :class="{ 'bg-[#f8e6ef]': prateleirasVisiveis === vitrine.id, 'forcar-hover': isButtonHovered(vitrine.id) }"
                    @click.stop="handleClickVitrine(vitrine.id, $event)"
                    @mouseenter="openShelfOnHover(vitrine.id, $event)"
                    @mouseleave="closeShelfOnLeaveDebounced"
                    :aria-expanded="prateleirasVisiveis === vitrine.id"
                    type="button"
                  >
                    {{ vitrine.nome }}
                  </button>
                </div>
              </template>

              <div v-else class="text-sm text-gray-400 px-3">Carregando categorias...</div>
              <span class="end-spacer" aria-hidden="true"></span>
            </div>

            <button
              v-if="showControllers"
              class="controller right-controller hidden md:flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 bg-white p-1 rounded-full shadow-sm z-20"
              @click="scrollByOffset(scrollStep)"
              aria-label="Próximo"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div class="hidden md:flex items-center gap-2 shrink-0 justify-end" @click="sacolaRef?.abrirSacola()" role="button" aria-label="Abrir sacola">
          <span :key="totalPreco" class="price-loop" aria-live="polite">R$ {{ totalPreco.toFixed(2) }}</span>
          <img src="/money.png" alt="sacola" class="w-10 h-10 icon-click" />
        </div>
      </div>
    </div>
  </header>

  <div
    v-if="prateleirasVisiveis !== null && selectedVitrineShelf"
    ref="dropdownEl"
    class="fixed min-w-[180px] bg-white text-[#d56aa0] rounded shadow-md p-2 z-60"
    :style="`top: ${dropdownCoords.top}px; left: ${dropdownCoords.left}px`"
    @mouseenter="clearCloseTimeout"
    @mouseleave="closeShelfOnLeaveDebounced"
  >
    <router-link
      v-for="prateleira in selectedVitrineShelf.prateleiras"
      :key="prateleira.id"
      class="font-medium hover:underline cursor-pointer whitespace-nowrap py-1 px-2 block"
      :to="`/prateleira/${prateleira.id}`"
      @click="closeDropdownOnSelect"
    >
      {{ prateleira.nome }}
    </router-link>
  </div>

  <SacolaLateral ref="sacolaRef" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import SacolaLateral from '@/components/sacola/sacolaLateral.vue';
import { useSacolaStore } from '@/stores/useSacolaStore';

interface Prateleira { id: number; nome: string; }
interface Vitrine { id: number; documentId?: string; nome: string; prateleiras?: Prateleira[]; }

const sacolaRef = ref<InstanceType<typeof SacolaLateral> | null>(null);
const vitrines = ref<Vitrine[]>([]);
const prateleirasVisiveis = ref<number | null>(null);
const dropdownCoords = ref({ top: 0, left: 0 });

const selectedVitrineShelf = computed(() => {
  if (prateleirasVisiveis.value === null) return null;
  const v = vitrines.value.find(x => x.id == prateleirasVisiveis.value);
  return v ? { ...v, prateleiras: v.prateleiras || [] } : null;
});

/* carousel / drag state */
const carouselContainer = ref<HTMLElement | null>(null);
const dropdownEl = ref<HTMLElement | null>(null);

/* pointer-down snapshot (usado na decisão click vs drag) */
const pointerDownState = {
  active: false,
  startX: 0,
  startY: 0,
  startScrollLeft: 0,
  pointerId: null as number | null
};

/* flags */
const isPointerDown = ref(false);
const isDragging = ref(false);

/* thresholds */
const DRAG_THRESHOLD = 6;           // pixels do ponteiro
const SCROLL_DRAG_THRESHOLD = 4;    // pixels de scroll do container que consideramos "arraste"

/* timer para limpeza após pointerup (mantemos curto para permitir click) */
let pointerDownClearTimer: ReturnType<typeof setTimeout> | null = null;

/* RAF used only for controller smooth scroll */
let rafId: number | null = null;
let targetScrollLeft: number | null = null;

const scrollStep = 220;

/* detecta se estamos em desktop (reativo) */
const isDesktop = ref(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
const showControllers = computed(() => isDesktop.value);

/* HOVER related (adicionado para reproduzir comportamento antigo no desktop) */
let closeDropdownTimeout: ReturnType<typeof setTimeout> | null = null;
const hoveringShelfArea = ref(false);

function isButtonHovered(vitrineId: number): boolean {
  return prateleirasVisiveis.value === vitrineId && hoveringShelfArea.value;
}

function clearCloseTimeout() {
  hoveringShelfArea.value = true;
  if (closeDropdownTimeout) {
    clearTimeout(closeDropdownTimeout);
    closeDropdownTimeout = null;
  }
}

function closeShelfOnLeave() {
  hoveringShelfArea.value = false;
  if (window.innerWidth >= 768) {
    closeDropdownTimeout = setTimeout(() => {
      if (!hoveringShelfArea.value) {
        prateleirasVisiveis.value = null;
      }
    }, 200);
  }
}

function closeShelfOnLeaveDebounced() {
  closeShelfOnLeave();
}

function openShelfOnHover(id: number, event?: MouseEvent | PointerEvent | Event) {
  // Aplica hover apenas em desktop
  if (!isDesktop.value) return;

  hoveringShelfArea.value = true;

  if (closeDropdownTimeout) {
    clearTimeout(closeDropdownTimeout);
    closeDropdownTimeout = null;
  }

  prateleirasVisiveis.value = id;

  // posiciona dropdown baseado no botão (usa currentTarget quando possível)
  const el = (event && (event.currentTarget as HTMLElement)) || (event && (event.target as HTMLElement));
  if (el) {
    const rect = el.getBoundingClientRect();
    dropdownCoords.value = getDropdownPosition(rect);
    nextTick(() => {
      if (dropdownEl.value) dropdownCoords.value = getDropdownPosition(rect);
    });
  }
}

/* abrir/fechar prateleiras por clique
   Decisão de supressão do click baseada no delta do ponteiro ou delta do scroll
*/
function handleClickVitrine(id: number, event?: MouseEvent | PointerEvent | TouchEvent | Event) {
  // se tivemos um pointerdown recente, decide via delta do ponteiro ou delta do scroll
  if (pointerDownState.active && carouselContainer.value) {
    let wasDrag = false;

    // se o evento fornece coordenadas do ponteiro, use isso (mais confiável para mouse)
    if (event && 'clientX' in event && typeof (event as MouseEvent).clientX === 'number') {
      const ev = event as MouseEvent;
      const dx = Math.abs(ev.clientX - pointerDownState.startX);
      const dy = Math.abs(ev.clientY - pointerDownState.startY);
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) wasDrag = true;
    } else {
      // fallback: usar delta de scroll
      const scrollDelta = Math.abs(carouselContainer.value.scrollLeft - pointerDownState.startScrollLeft);
      if (scrollDelta > SCROLL_DRAG_THRESHOLD) wasDrag = true;
    }

    if (wasDrag || isDragging.value) {
      // foi arraste — suprime click
      clearPointerDownRecord();
      return;
    }
  }

  // se veio por teclado (sem pointer state), permitimos normalmente
  if (prateleirasVisiveis.value === id) {
    prateleirasVisiveis.value = null;
  } else {
    prateleirasVisiveis.value = id;

    if (event) {
      // impedir que o click borbulhe até document e faça close imediato
      try { (event as Event).stopPropagation(); } catch {}

      // preferir currentTarget (o botão) para posicionar o dropdown
      const el = (event.currentTarget as HTMLElement) ?? (event.target as HTMLElement);
      if (el) {
        const rect = el.getBoundingClientRect();
        dropdownCoords.value = getDropdownPosition(rect);
        nextTick(() => {
          if (dropdownEl.value) {
            dropdownCoords.value = getDropdownPosition(rect);
          }
        });
      }
    }
  }

  clearPointerDownRecord();
}

/* fechar dropdown ao selecionar uma prateleira */
function closeDropdownOnSelect() {
  prateleirasVisiveis.value = null;
  hoveringShelfArea.value = false;
}

/* fechar se clicar fora */
function handleDocumentClick(e: MouseEvent) {
  const t = e.target as Node | null;
  if (prateleirasVisiveis.value === null) return;
  if (carouselContainer.value?.contains(t as Node)) return;
  if (dropdownEl.value?.contains(t as Node)) return;
  prateleirasVisiveis.value = null;
  hoveringShelfArea.value = false;
}

/* limpa o registro de pointerdown / estado */
function clearPointerDownRecord() {
  pointerDownState.active = false;
  pointerDownState.startX = 0;
  pointerDownState.startY = 0;
  pointerDownState.startScrollLeft = 0;
  pointerDownState.pointerId = null;
  isPointerDown.value = false;
  isDragging.value = false;
  if (pointerDownClearTimer) {
    clearTimeout(pointerDownClearTimer);
    pointerDownClearTimer = null;
  }
}

/* DRAG handlers (atualização imediata durante o drag) */
function onPointerDown(e: PointerEvent) {
  if (!carouselContainer.value) return;

  const target = e.target as HTMLElement | null;
  // não iniciar drag se clicou nas controllers (setas)
  if (target?.closest('.controller')) return;

  isPointerDown.value = true;
  isDragging.value = false;

  // snapshot do pointerdown
  pointerDownState.active = true;
  pointerDownState.startX = e.clientX;
  pointerDownState.startY = e.clientY;
  pointerDownState.startScrollLeft = carouselContainer.value.scrollLeft;
  pointerDownState.pointerId = e.pointerId ?? null;

  if (pointerDownClearTimer) {
    clearTimeout(pointerDownClearTimer);
    pointerDownClearTimer = null;
  }

  try { carouselContainer.value.setPointerCapture?.(e.pointerId); } catch {}

  try { document.body.style.userSelect = 'none'; } catch {}
}

function animateScroll() {
  if (!carouselContainer.value || targetScrollLeft === null) { rafId = null; return; }
  const cur = carouselContainer.value.scrollLeft;
  const next = lerp(cur, targetScrollLeft, 0.22);
  carouselContainer.value.scrollLeft = next;
  if (Math.abs(next - targetScrollLeft) < 0.5) {
    carouselContainer.value.scrollLeft = targetScrollLeft;
    targetScrollLeft = null;
    rafId = null;
    return;
  }
  rafId = requestAnimationFrame(animateScroll);
}

function onPointerMove(e: PointerEvent) {
  if (!pointerDownState.active || !carouselContainer.value) return;

  const x = e.clientX;
  const walk = pointerDownState.startX - x;

  // atualiza scroll imediatamente (sensação fluida)
  const maxScroll = Math.max(0, carouselContainer.value.scrollWidth - carouselContainer.value.clientWidth);
  const newScroll = pointerDownState.startScrollLeft + walk;
  carouselContainer.value.scrollLeft = Math.max(0, Math.min(newScroll, maxScroll));

  // se o scroll efetivamente mudou o suficiente, consideramos arraste
  const scrollDelta = Math.abs(carouselContainer.value.scrollLeft - pointerDownState.startScrollLeft);
  if (Math.abs(walk) > DRAG_THRESHOLD || scrollDelta > SCROLL_DRAG_THRESHOLD) {
    isDragging.value = true;
  }
}

function onPointerUp(e?: PointerEvent | MouseEvent) {
  if (carouselContainer.value) {
    // tentar liberar captura (se aplicável)
    try {
      if (e && 'pointerId' in e && e.pointerId != null) {
        try { (e.target as Element).releasePointerCapture?.((e as PointerEvent).pointerId); } catch {}
      } else if (pointerDownState.pointerId != null) {
        try { carouselContainer.value.releasePointerCapture?.(pointerDownState.pointerId); } catch {}
      }
    } catch {}
  }

  try { document.body.style.userSelect = ''; } catch {}

  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }

  // mantemos o estado por um curto período para que o click seja disparado e o handler
  // possa checar o delta de scroll. Depois limpamos.
  if (pointerDownClearTimer) clearTimeout(pointerDownClearTimer);
  pointerDownClearTimer = setTimeout(() => {
    clearPointerDownRecord();
  }, 150);
}

/* wrapper pra mouseleave (evita conflito de tipos) */
function onPointerUpNoEvent() { onPointerUp(); }

/* scroll via controllers (usa RAF + lerp para suavidade nos cliques) */
function scrollByOffset(offset: number) {
  if (!carouselContainer.value) return;
  const maxScroll = Math.max(0, carouselContainer.value.scrollWidth - carouselContainer.value.clientWidth);
  const target = Math.max(0, Math.min(carouselContainer.value.scrollLeft + offset, maxScroll));
  targetScrollLeft = target;
  if (rafId === null) rafId = requestAnimationFrame(animateScroll);
}

/* util lerp (para controllers) */
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

/* calcular posição do dropdown (centraliza e evita overflow) */
function getDropdownPosition(rect: DOMRect) {
  const dropdownWidth = dropdownEl.value ? dropdownEl.value.offsetWidth : 220;
  const dropdownMargin = 12;
  const controllerPadding = 60;

  let centerLeft = rect.left + window.scrollX + rect.width / 2 - dropdownWidth / 2;
  const isNearRight = rect.right > window.innerWidth - controllerPadding;
  if (isNearRight) centerLeft -= 40;

  const maxLeft = window.innerWidth - dropdownWidth - dropdownMargin;
  const safeLeft = Math.max(dropdownMargin, Math.min(centerLeft, maxLeft));
  const safeTop = rect.bottom + window.scrollY + 8;
  return { top: safeTop, left: safeLeft };
}

/* fetch vitrines (normaliza) */
async function fetchVitrines() {
  try {
    const strapiUrl = 'https://nice-eggs-d79e24d7a7.strapiapp.com';
    const response = await fetch(`${strapiUrl}/api/vitrines?populate=prateleiras`);
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    const data = await response.json();

    vitrines.value = (data.data || []).map((item: any) => {
      const prRaw = item.prateleiras ?? item.attributes?.prateleiras ?? null;
      let pr: Prateleira[] = [];
      if (Array.isArray(prRaw)) pr = prRaw.map((p: any) => ({ id: p.id, nome: p.nome ?? p.attributes?.nome ?? 'Sem nome' }));
      else if (prRaw?.data && Array.isArray(prRaw.data)) pr = prRaw.data.map((p: any) => ({ id: p.id, nome: p.attributes?.nome ?? 'Sem nome' }));

      return { id: item.id, documentId: item.documentId ?? item.attributes?.documentId, nome: item.nome ?? item.attributes?.nome ?? 'Categoria', prateleiras: pr } as Vitrine;
    });
  } catch (err) {
    console.error('Erro ao buscar vitrines do Strapi:', err);
    vitrines.value = [];
  }
}

/* cleanup helper */
function cleanupAfterPointer() {
  if (pointerDownClearTimer) { clearTimeout(pointerDownClearTimer); pointerDownClearTimer = null; }
  clearPointerDownRecord();
  try { document.body.style.userSelect = ''; } catch {}
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  targetScrollLeft = null;
}

/* ciclo de vida */
onMounted(() => {
  fetchVitrines();
  document.addEventListener('click', handleDocumentClick);
  window.addEventListener('resize', onWindowResize);
  onWindowResize();
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick);
  window.removeEventListener('resize', onWindowResize);
  cleanupAfterPointer();
  if (closeDropdownTimeout) { clearTimeout(closeDropdownTimeout); closeDropdownTimeout = null; }
});

function onWindowResize() {
  isDesktop.value = typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
}

/* fechar dropdown ao navegar para outra rota */
const route = useRoute();
watch(() => route.fullPath, () => { prateleirasVisiveis.value = null; hoveringShelfArea.value = false; });

/* sacola store */
const sacolaStore = useSacolaStore();
const totalPreco = computed(() => sacolaStore.totalPreco);
</script>

<style scoped>
.site-header,
.site-header * {
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
.site-header *:focus:not(:focus-visible) { outline: none !important; box-shadow: none !important; }

.horizontal-scroll {
  -webkit-overflow-scrolling: touch;
  overflow-x: auto;
  overflow-y: hidden;
  padding-left: 20px;
  padding-right: 20px;
  gap: 12px;
  touch-action: pan-y;
  cursor: grab;
  min-width: 0;
}
.horizontal-scroll:active { cursor: grabbing; }
.horizontal-scroll::before,
.horizontal-scroll::after,
.end-spacer { width: 12px; display: inline-block; flex: 0 0 12px; }
.scrollbar-hidden::-webkit-scrollbar { display: none; }
.scrollbar-hidden { scrollbar-width: none; }

.vitrine-btn {
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  min-width: 48px;
}
.vitrine-btn:focus { outline: none; }
.vitrine-btn:focus-visible { outline: 2px solid rgba(213,106,160,0.9); outline-offset: 2px; }

/* efeito hover "forcar-hover" herdado do antigo */
.forcar-hover {
  background-color: rgba(0,0,0,0.3);
  color: white !important;
}

/* se quiser também o ícone X como antes, pode re-adicionar SVG dentro do botão com opacity controlada */

.controller { width: 36px; height: 36px; }
.left-controller { transform: translateX(-8px); }
.right-controller { transform: translateX(8px); }

.icon-click { cursor: pointer; transition: transform 160ms cubic-bezier(.2,.9,.2,1), box-shadow 160ms; display: inline-block; }
.icon-click:active { transform-origin: center; animation: clickPop 0.32s ease-in-out; }
@keyframes clickPop { 0%{transform:scale(1)}40%{transform:scale(0.85)}60%{transform:scale(1.08)}100%{transform:scale(1)} }

.price-loop {
  display: inline-block;
  animation: priceSlideLoop 3.6s cubic-bezier(.2,.9,.2,1) infinite;
  font-family: "Nunito", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.2px;
  margin-left: 0.25rem;
  will-change: transform, opacity;
}
@keyframes priceSlideLoop { 0%{opacity:0;transform:translateX(12px)}10%{opacity:1;transform:translateX(0)}70%{opacity:1;transform:translateX(0)}100%{opacity:0;transform:translateX(-12px)} }

@media (prefers-reduced-motion: reduce) {
  .price-loop, .icon-click { animation: none !important; transition: none !important; }
}
@media (max-width: 640px) {
  .price-loop { font-size: 0.95rem; margin-left: 0.4rem; }
  .controller { display: none !important; }
}
</style>
