<template>
  <header class="bg-[#d56aa0] text-white p-5 flex justify-center">
    <div
      class="flex flex-col items-center gap-5 w-full max-w-screen-xl md:flex-row md:justify-between md:items-end mx-auto"
    >
      <div class="flex flex-col items-center md:items-start">
        <router-link to="/" class="text-3xl font-bold mb-1 text-white hover:opacity-80 transition cursor-pointer">
  meukkul
</router-link>

        <div class="mt-0">
          <input
            type="text"
            placeholder="Buscar produtos..."
            class="py-2 px-3 border border-white border-1 rounded-full w-[90vw] max-w-[300px] md:w-64 text-base focus:outline-none focus:border-white focus:border-2"
          />
        </div>
      </div>

      <nav
        class="relative w-[90vw] max-w-[360px] md:w-[360px] flex-shrink-0"
      >
        <div class="overflow-hidden h-[50px] w-full relative">
          <div
            id="categoryCarousel"
            class="flex flex-col transition-transform duration-600 ease-in-out"
            @mouseenter="pauseCarousel"
            @mouseleave="handleCarouselMouseLeave"
          >
            
            <transition name="fade" mode="out-in">
              <div
                v-if="vitrines.length > 0"
                :key="groupIndex"
                class="flex justify-center gap-3 h-[50px]"
              >
                <div
                  v-for="vitrine in vitrines.slice(groupIndex * itemsPerGroup, (groupIndex + 1) * itemsPerGroup)"
                  :key="vitrine.id"
                  class="relative inline-flex items-center justify-center"
                >
                  <button
                    class="relative whitespace-nowrap bg-white text-[#d56aa0] border border-[#d56aa0] py-2 px-4 rounded-full cursor-pointer font-bold transition-colors duration-300 ease-in-out hover:bg-black/30"
                    :class="{ 'forcar-hover': isButtonHovered(vitrine.id) }"
                    @mouseenter="openShelfOnHover(vitrine.id, $event)"
                    @mouseleave="closeShelfOnLeaveDebounced"
                    @click="handleClick(vitrine.id, $event)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="absolute inset-0 m-auto w-4 h-4 text-white opacity-0 transition-opacity duration-200 pointer-events-none"
                      :class="{ 'opacity-100': isButtonHovered(vitrine.id) }"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="3"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    {{ vitrine.nome }}
                  </button>
                </div>
              </div>
            </transition>

            <div
              v-if="vitrines.length === 0 && totalGroups === 0"
              class="flex justify-center gap-3 h-[50px] items-center text-gray-500"
            >
              Carregando categorias...
            </div>
          </div>
        </div>

        <div
          class="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50"
        >
          <button
            @click="prevGroup"
            v-if="totalGroups > 1"
            class="bg-white text-[#d56aa0] p-1 rounded-full shadow-lg hover:bg-[#ffd6ec] transition"
            :class="{ 'opacity-50 cursor-not-allowed': groupIndex === 0 }"
            :disabled="groupIndex === 0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414 6.707 12.707a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>

          <button
            @click="nextGroup"
            v-if="totalGroups > 1"
            class="bg-white text-[#d56aa0] p-1 rounded-full shadow-lg hover:bg-[#ffd6ec] transition"
            :class="{ 'opacity-50 cursor-not-allowed': groupIndex === totalGroups - 1 }"
            :disabled="groupIndex === totalGroups - 1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </nav>

      <div
        class="text-2xl cursor-pointer whitespace-nowrap order-4 md:order-none"
      >
        sacola
      </div>
    </div>
  </header>

  <div
    v-if="prateleirasVisiveis !== null && selectedVitrineShelf"
    class="fixed min-w-[180px] bg-white text-[#d56aa0] rounded shadow-md p-2 z-50"
    :style="`top: ${dropdownCoords.top}px; left: ${dropdownCoords.left}px`"
    @mouseenter="clearCloseTimeout"
    @mouseleave="closeShelfOnLeaveDebounced"
  >
    <router-link
      v-for="prateleira in selectedVitrineShelf.prateleiras"
      :key="prateleira.id"
      class="font-medium hover:underline cursor-pointer whitespace-nowrap py-1 px-2 block"
      :to="`/prateleira/${prateleira.id}`"
    >
      {{ prateleira.nome }}
    </router-link>

  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue';

interface Prateleira {
  id: number;
  nome: string;
}

interface Vitrine {
  id: number;
  documentId: string;
  nome: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  prateleiras?: Prateleira[];
}

const vitrines = ref<Vitrine[]>([]);
const prateleirasVisiveis = ref<number | null>(null);
let intervalId: number | null = null;
const groupIndex = ref(0);
const itemsPerGroup = 3;
const totalGroups = ref(0);
const carouselSpeed = 3000;
const dropdownCoords = ref({ top: 0, left: 0 });

let closeDropdownTimeout: ReturnType<typeof setTimeout> | null = null;
const hoveringShelfArea = ref(false);

const selectedVitrineShelf = computed(() => {
  if (prateleirasVisiveis.value === null) return null;
  const vitrine = vitrines.value.find(
    (v) => v.id === prateleirasVisiveis.value
  );
  return vitrine
    ? { ...vitrine, prateleiras: vitrine.prateleiras || [] }
    : null;
});

function isButtonHovered(vitrineId: number): boolean {
  return prateleirasVisiveis.value === vitrineId && hoveringShelfArea.value;
}

function startCarousel() {
  if (intervalId !== null) clearInterval(intervalId);
  if (totalGroups.value > 1) {
    intervalId = setInterval(() => {
      groupIndex.value = (groupIndex.value + 1) % totalGroups.value;
    }, carouselSpeed) as unknown as number;
  }
}

function pauseCarousel() {
  if (intervalId !== null) clearInterval(intervalId);
}

function resumeCarousel() {
  startCarousel();
}

function handleCarouselMouseLeave() {
  if (prateleirasVisiveis.value === null) {
    resumeCarousel();
  }
}

function nextGroup() {
  pauseCarousel();
  prateleirasVisiveis.value = null;
  groupIndex.value =
    (groupIndex.value + 1) % totalGroups.value;
  resumeCarousel();
}

function prevGroup() {
  pauseCarousel();
  prateleirasVisiveis.value = null;
  groupIndex.value =
    (groupIndex.value - 1 + totalGroups.value) %
    totalGroups.value;
  resumeCarousel();
}

function getDropdownPosition(rect: DOMRect): {
  top: number;
  left: number;
} {
  const dropdownWidth = 180;
  const dropdownMargin = 12;
  const controllerPadding = 60;

  let centerLeft =
    rect.left +
    window.scrollX +
    rect.width / 2 -
    dropdownWidth / 2;

  const isNearRight =
    rect.right > window.innerWidth - controllerPadding;
  if (isNearRight) {
    centerLeft -= 40;
  }

  const maxLeft =
    window.innerWidth - dropdownWidth - dropdownMargin;
  const safeLeft = Math.max(
    dropdownMargin,
    Math.min(centerLeft, maxLeft)
  );
  const safeTop =
    rect.bottom + window.scrollY + 10;

  return { top: safeTop, left: safeLeft };
}

function openShelfOnHover(
  id: number,
  event: MouseEvent
) {
  hoveringShelfArea.value = true;

  if (closeDropdownTimeout) {
    clearTimeout(closeDropdownTimeout);
    closeDropdownTimeout = null;
  }

  if (window.innerWidth > 768) {
    prateleirasVisiveis.value = id;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    dropdownCoords.value = getDropdownPosition(rect);
  }

  pauseCarousel();
}

function handleClick(
  id: number,
  event?: MouseEvent | TouchEvent
) {
  if (closeDropdownTimeout) {
    clearTimeout(closeDropdownTimeout);
    closeDropdownTimeout = null;
  }

  if (prateleirasVisiveis.value === id) {
    prateleirasVisiveis.value = null;
    resumeCarousel();
  } else {
    prateleirasVisiveis.value = id;
    pauseCarousel();

    if (event) {
      const target = event.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      dropdownCoords.value = getDropdownPosition(rect);
    }
  }
}

function closeShelfOnLeave() {
  hoveringShelfArea.value = false;
  if (window.innerWidth > 768) {
    closeDropdownTimeout = setTimeout(() => {
      if (!hoveringShelfArea.value) {
        prateleirasVisiveis.value = null;
        resumeCarousel();
      }
    }, 200);
  }
}

function clearCloseTimeout() {
  hoveringShelfArea.value = true;
  if (closeDropdownTimeout) {
    clearTimeout(closeDropdownTimeout);
    closeDropdownTimeout = null;
  }
}

function closeShelfOnLeaveDebounced() {
  closeShelfOnLeave();
}

async function fetchVitrines() {
  try {
    const strapiUrl =
      'https://nice-eggs-d79e24d7a7.strapiapp.com';
    const response = await fetch(
      `${strapiUrl}/api/vitrines?populate=prateleiras`
    );

    if (!response.ok)
      throw new Error(
        `Erro HTTP: ${response.status} ${response.statusText}`
      );

    const data = await response.json();

    vitrines.value = data.data.map((item: any) => ({
      id: item.id,
      documentId: item.documentId,
      nome: item.nome,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      publishedAt: item.publishedAt,
      prateleiras:
        item.prateleiras &&
        Array.isArray(item.prateleiras)
          ? item.prateleiras
          : item.prateleiras &&
            item.prateleiras.data &&
            Array.isArray(item.prateleiras.data)
          ? item.prateleiras.data.map((p: any) => ({
              id: p.id,
              nome: p.attributes
                ? p.attributes.nome
                : p.nome, 
            }))
          : [],
    }));


    totalGroups.value = Math.ceil(
      vitrines.value.length / itemsPerGroup
    );
    startCarousel();
  } catch (error) {
    console.error(
      'Erro ao buscar vitrines do Strapi:',
      error
    );
  }
}

onMounted(() => {
  fetchVitrines();
});

onUnmounted(() => {
  if (intervalId !== null) clearInterval(intervalId);
  if (closeDropdownTimeout !== null)
    clearTimeout(closeDropdownTimeout);
});
</script>

<style scoped>
.forcar-hover {
  background-color: rgba(0, 0, 0, 0.3);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
