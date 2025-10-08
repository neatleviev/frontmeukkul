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
                    :data-vitrine-id="vitrine.id"
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

const carouselContainer = ref<HTMLElement | null>(null);
const dropdownEl = ref<HTMLElement | null>(null);
const pointerDownState = { active: false, startX: 0, startY: 0, startScrollLeft: 0, pointerId: null as number | null };
const isPointerDown = ref(false);
const isDragging = ref(false);
const DRAG_THRESHOLD = 6;
const SCROLL_DRAG_THRESHOLD = 4;
let pointerDownClearTimer: ReturnType<typeof setTimeout> | null = null;
let rafId: number | null = null;
let targetScrollLeft: number | null = null;
const scrollStep = 220;
const isDesktop = ref(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
const showControllers = computed(() => isDesktop.value);

let closeDropdownTimeout: ReturnType<typeof setTimeout> | null = null;
const hoveringShelfArea = ref(false);

function isButtonHovered(vitrineId: number) {
  return prateleirasVisiveis.value === vitrineId && hoveringShelfArea.value;
}
function clearCloseTimeout() {
  hoveringShelfArea.value = true;
  if (closeDropdownTimeout) clearTimeout(closeDropdownTimeout);
}
function closeShelfOnLeave() {
  hoveringShelfArea.value = false;
  if (window.innerWidth >= 768) {
    closeDropdownTimeout = setTimeout(() => {
      if (!hoveringShelfArea.value) prateleirasVisiveis.value = null;
    }, 200);
  }
}
function closeShelfOnLeaveDebounced() { closeShelfOnLeave(); }

function openShelfOnHover(id: number, event?: MouseEvent | PointerEvent | Event) {
  if (!isDesktop.value) return;
  hoveringShelfArea.value = true;
  if (closeDropdownTimeout) clearTimeout(closeDropdownTimeout);
  prateleirasVisiveis.value = id;
  const el = (event?.currentTarget as HTMLElement) || (event?.target as HTMLElement);
  if (el) {
    const rect = el.getBoundingClientRect();
    dropdownCoords.value = getDropdownPosition(rect);
    nextTick(() => {
      if (dropdownEl.value) dropdownCoords.value = getDropdownPosition(rect);
    });
  }
}

function handleClickVitrine(id: number, event?: MouseEvent | PointerEvent | TouchEvent | Event) {
  if (pointerDownState.active && carouselContainer.value) {
    let wasDrag = false;
    if (event && 'clientX' in event) {
      const ev = event as MouseEvent;
      const dx = Math.abs(ev.clientX - pointerDownState.startX);
      const dy = Math.abs(ev.clientY - pointerDownState.startY);
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) wasDrag = true;
    } else {
      const scrollDelta = Math.abs(carouselContainer.value.scrollLeft - pointerDownState.startScrollLeft);
      if (scrollDelta > SCROLL_DRAG_THRESHOLD) wasDrag = true;
    }
    if (wasDrag || isDragging.value) { clearPointerDownRecord(); return; }
  }
  if (prateleirasVisiveis.value === id) {
    prateleirasVisiveis.value = null;
  } else {
    prateleirasVisiveis.value = id;
    if (event) {
      try { (event as Event).stopPropagation(); } catch {}
      const el = (event.currentTarget as HTMLElement) ?? (event.target as HTMLElement);
      if (el) {
        const rect = el.getBoundingClientRect();
        dropdownCoords.value = getDropdownPosition(rect);
        nextTick(() => { if (dropdownEl.value) dropdownCoords.value = getDropdownPosition(rect); });
      }
    }
  }
  clearPointerDownRecord();
}

function closeDropdownOnSelect() {
  prateleirasVisiveis.value = null;
  hoveringShelfArea.value = false;
}

// document click handler: desktop respects "click outside to close" behavior,
// while mobile closes on any click (requested behavior).
function handleDocumentClick(e: MouseEvent) {
  if (prateleirasVisiveis.value === null) return;
  if (!isDesktop.value) {
    // Mobile: close on any click/tap
    prateleirasVisiveis.value = null;
    hoveringShelfArea.value = false;
    cleanupAfterPointer();
    return;
  }
  // Desktop: only close when click is outside carousel and dropdown
  const t = e.target as Node | null;
  if (carouselContainer.value?.contains(t as Node)) return;
  if (dropdownEl.value?.contains(t as Node)) return;
  prateleirasVisiveis.value = null;
  hoveringShelfArea.value = false;
}

function clearPointerDownRecord() {
  pointerDownState.active = false;
  pointerDownState.startX = 0;
  pointerDownState.startY = 0;
  pointerDownState.startScrollLeft = 0;
  pointerDownState.pointerId = null;
  isPointerDown.value = false;
  isDragging.value = false;
  if (pointerDownClearTimer) { clearTimeout(pointerDownClearTimer); pointerDownClearTimer = null; }
}

function onPointerDown(e: PointerEvent) {
  if (!carouselContainer.value) return;
  const target = e.target as HTMLElement | null;
  if (target?.closest('.controller')) return;
  isPointerDown.value = true;
  isDragging.value = false;
  pointerDownState.active = true;
  pointerDownState.startX = e.clientX;
  pointerDownState.startY = e.clientY;
  pointerDownState.startScrollLeft = carouselContainer.value.scrollLeft;
  pointerDownState.pointerId = e.pointerId ?? null;
  try { carouselContainer.value.setPointerCapture?.(e.pointerId); } catch {}
  document.body.style.userSelect = 'none';
}

function animateScroll() {
  if (!carouselContainer.value || targetScrollLeft === null) { rafId = null; return; }
  const cur = carouselContainer.value.scrollLeft;
  const next = cur + (targetScrollLeft - cur) * 0.22;
  carouselContainer.value.scrollLeft = next;
  if (Math.abs(next - targetScrollLeft) < 0.5) { carouselContainer.value.scrollLeft = targetScrollLeft; targetScrollLeft = null; rafId = null; return; }
  rafId = requestAnimationFrame(animateScroll);
}

function onPointerMove(e: PointerEvent) {
  if (!pointerDownState.active || !carouselContainer.value) return;
  const x = e.clientX;
  const walk = pointerDownState.startX - x;
  const maxScroll = Math.max(0, carouselContainer.value.scrollWidth - carouselContainer.value.clientWidth);
  const newScroll = pointerDownState.startScrollLeft + walk;
  carouselContainer.value.scrollLeft = Math.max(0, Math.min(newScroll, maxScroll));
  const scrollDelta = Math.abs(carouselContainer.value.scrollLeft - pointerDownState.startScrollLeft);
  if (Math.abs(walk) > DRAG_THRESHOLD || scrollDelta > SCROLL_DRAG_THRESHOLD) isDragging.value = true;
}

function onPointerUp(e?: PointerEvent | MouseEvent) {
  if (carouselContainer.value) {
    try {
      if (e && 'pointerId' in e && e.pointerId != null) (e.target as Element).releasePointerCapture?.(e.pointerId);
      else if (pointerDownState.pointerId != null) carouselContainer.value.releasePointerCapture?.(pointerDownState.pointerId);
    } catch {}
  }
  document.body.style.userSelect = '';
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  if (pointerDownClearTimer) clearTimeout(pointerDownClearTimer);
  pointerDownClearTimer = setTimeout(clearPointerDownRecord, 150);
}
function onPointerUpNoEvent() { onPointerUp(); }

function scrollByOffset(offset: number) {
  if (!carouselContainer.value) return;
  const maxScroll = Math.max(0, carouselContainer.value.scrollWidth - carouselContainer.value.clientWidth);
  const target = Math.max(0, Math.min(carouselContainer.value.scrollLeft + offset, maxScroll));
  targetScrollLeft = target;
  if (rafId === null) rafId = requestAnimationFrame(animateScroll);
}

function getDropdownPosition(rect: DOMRect) {
  const dropdownWidth = dropdownEl.value ? Math.max(180, dropdownEl.value.offsetWidth) : 220;
  const dropdownHeight = dropdownEl.value ? dropdownEl.value.offsetHeight : 200;
  const margin = 12;
  const gap = 8;
  let left = rect.left + rect.width / 2 - dropdownWidth / 2;
  const maxLeft = window.innerWidth - dropdownWidth - margin;
  left = Math.max(margin, Math.min(left, maxLeft));
  let top = rect.bottom + gap;
  if (dropdownEl.value) {
    const maxTop = window.innerHeight - dropdownEl.value.offsetHeight - margin;
    if (top > maxTop) {
      top = rect.top - dropdownEl.value.offsetHeight - gap;
      if (top < margin) top = margin;
    }
  } else {
    if (top > window.innerHeight - 60) top = Math.max(margin, window.innerHeight - dropdownHeight - margin);
  }
  return { top, left };
}

function repositionDropdownForActive() {
  if (prateleirasVisiveis.value === null) return;
  const selector = `[data-vitrine-id="${prateleirasVisiveis.value}"]`;
  const btn = carouselContainer.value?.querySelector(selector) as HTMLElement | null;
  if (btn) {
    const rect = btn.getBoundingClientRect();
    dropdownCoords.value = getDropdownPosition(rect);
  }
}

function onWindowScroll() {
  if (prateleirasVisiveis.value !== null) {
    if (!isDesktop.value) {
      // Mobile: close dropdown on any page scroll
      prateleirasVisiveis.value = null;
      hoveringShelfArea.value = false;
      cleanupAfterPointer();
      return;
    }
    repositionDropdownForActive();
  }
}

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

function cleanupAfterPointer() {
  if (pointerDownClearTimer) { clearTimeout(pointerDownClearTimer); pointerDownClearTimer = null; }
  clearPointerDownRecord();
  document.body.style.userSelect = '';
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  targetScrollLeft = null;
}

// ---- Mobile "close on any interaction" handlers ----
function handleGlobalPointerDown(e: Event) {
  if (prateleirasVisiveis.value === null || isDesktop.value) return;
  // close immediately on pointer down (mobile): requested behaviour
  prateleirasVisiveis.value = null;
  hoveringShelfArea.value = false;
  cleanupAfterPointer();
}

function handleGlobalPointerMove(e: PointerEvent) {
  if (prateleirasVisiveis.value === null || isDesktop.value) return;
  prateleirasVisiveis.value = null;
  hoveringShelfArea.value = false;
  cleanupAfterPointer();
}

function handleGlobalTouchMove(e: TouchEvent) {
  if (prateleirasVisiveis.value === null || isDesktop.value) return;
  prateleirasVisiveis.value = null;
  hoveringShelfArea.value = false;
  cleanupAfterPointer();
}

onMounted(() => {
  fetchVitrines();
  document.addEventListener('click', handleDocumentClick);
  // Mobile: close dropdown on any pointerdown / move / touchmove; desktop will ignore these handlers
  document.addEventListener('pointerdown', handleGlobalPointerDown);
  window.addEventListener('pointermove', handleGlobalPointerMove, { passive: true });
  window.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('scroll', onWindowScroll, { passive: true });
  onWindowResize();
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick);
  document.removeEventListener('pointerdown', handleGlobalPointerDown);
  window.removeEventListener('pointermove', handleGlobalPointerMove as any);
  window.removeEventListener('touchmove', handleGlobalTouchMove as any);

  window.removeEventListener('resize', onWindowResize);
  window.removeEventListener('scroll', onWindowScroll);
  cleanupAfterPointer();
});

function onWindowResize() {
  isDesktop.value = window.innerWidth >= 768;
  nextTick(() => repositionDropdownForActive());
}

const sacolaStore = useSacolaStore();
const totalPreco = computed(() => sacolaStore.totalPreco);
const route = useRoute();
watch(() => route.fullPath, () => {
  prateleirasVisiveis.value = null;
  hoveringShelfArea.value = false;
});
</script>

<style scoped>
.horizontal-scroll {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}
.scrollbar-hidden::-webkit-scrollbar { display: none; }
.scrollbar-hidden { scrollbar-width: none; }
.vitrine-btn.forcar-hover { background-color: #f8e6ef; }
.price-loop { transition: 0.2s; font-weight: bold; }
.icon-click { cursor: pointer; transition: 0.2s; }
.icon-click:hover { transform: scale(1.05); }
.controller { cursor: pointer; color: #d56aa0; }
.controller:hover { background-color: #fceaf3; }
.site-header { transition: box-shadow 0.3s ease; }
.z-60 { z-index: 60; }
</style>
