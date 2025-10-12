<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import BotaoVoltar from '@/components/BotaoVoltar.vue'
import cardProduto from '@/components/cardProduto.vue'
import { useSacolaStore } from '@/stores/useSacolaStore' // ✅ correto

// === Estado e rota ===
const route = useRoute()
const prateleiraId = ref<string | null>((route.params.id as string) || null)
const prateleiraNome = ref<string | null>(null)
const produtos = ref<any[]>([])

// === Strapi base ===
const strapiUrl = 'https://nice-eggs-d79e24d7a7.strapiapp.com'

// === Store da sacola ===
const sacola = useSacolaStore()
const total = computed(() => sacola.totalPreco) // ✅ corrigido

// === Bloqueio de brindes VIP ===
const bloqueado = computed(() => Number(prateleiraId.value) === 194 && total.value < 60)

function getImageUrl(url: string) {
  return url?.startsWith('http') ? url : `${strapiUrl}${url}`
}

// === Fetch de prateleira ===
async function fetchPrateleira(id: string) {
  try {
    const res = await fetch(
      `${strapiUrl}/api/prateleiras?filters[id][$eq]=${id}&populate[produtos][populate][0]=fotos&populate[produtos][populate][1]=variantes`
    )
    const json = await res.json()

    const prateleira = json.data?.[0]
    prateleiraNome.value = prateleira?.nome || 'Sem nome'

    produtos.value = (prateleira?.produtos || []).map((p: any) => ({
      id: p.id,
      nome: p.nome,
      preco: p.preco,
      fotos:
        p.fotos?.map((foto: any) => ({
          url: getImageUrl(foto.url),
          name: foto.name,
        })) ?? [],
      estoqueUnico: p.estoqueUnico,
      variantes: p.variantes ?? [],
      ticketPai: p.ticketPai,
    }))
  } catch (e) {
    console.error('Erro ao buscar prateleira:', e)
    prateleiraNome.value = 'Erro ao buscar nome'
    produtos.value = []
  }
}

// === Atualiza ao mudar o ID da rota ===
watch(
  () => route.params.id,
  (id) => {
    if (typeof id === 'string') {
      prateleiraId.value = id
      fetchPrateleira(id)
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="p-4 relative space-y-6">
    <h1 class="text-3xl font-bold text-[#d56aa0] text-center mb-4">
      <span v-if="prateleiraNome">{{ prateleiraNome }}</span>
    </h1>

    <div class="absolute left-4 top-4 z-40">
      <BotaoVoltar />
    </div>

    <!-- === Conteúdo principal encapsulado === -->
    <div class="page-content relative">
      <div
        v-if="produtos.length"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <cardProduto
          v-for="produto in produtos"
          :key="produto.ticketPai"
          :product="produto"
        />
      </div>

      <div v-else class="text-center text-gray-500">
        Nenhum produto encontrado para esta prateleira.
      </div>

      <!-- === BLOQUEIO VISUAL local (apenas sobre conteúdo) === -->
      <transition name="fade">
        <div
          v-if="bloqueado"
          class="absolute inset-0 z-45 pointer-events-auto overlay-fundo"
        >
          <!-- Mensagem fixa no topo -->
          <div class="w-full flex  justify-start  mt-6 ">
            <div class="bg-black bg-opacity-70 text-white text-lg font-semibold px-6 py-3 rounded-lg shadow-md">
              🛑 Brinde VIP disponível apenas para compras acima de R$60
            </div>
          </div>
        </div>

      </transition>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.overlay-fundo {
  background-color: rgba(0, 0, 0, 0.35);
}
</style>
