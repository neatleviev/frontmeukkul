<template>
  <section class="p-2 space-y-6">
    <div
      v-for="vitrine in superVitrines"
      :key="vitrine.id">
      
      <h2 class="text-2xl font-bold text-[#d56aa0] mb-4">
        {{ vitrine.nome }}
      </h2>

      <!-- Default: 2 colunas (mobile). Mantive 3 colunas em lg -->
      <ul class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 items-stretch" style="grid-auto-rows: 1fr;">
        <li
          v-for="produto in vitrine.produtos"
          :key="produto.ticketPai ?? produto.id"
          class="w-full h-full"
        >
          <CardProduto :product="produto" />
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import CardProduto from '@/components/cardProduto.vue' // ajuste caminho se necessário

interface Foto {
  url: string
  name?: string
}

interface Variante {
  id: number
  tamanho?: string
  cor?: string
  aroma?: string
  funcao?: string
  estoqueVariante?: number
}

interface Produto {
  id: number
  nome: string
  preco: number
  fotos: Foto[]
  estoqueUnico?: number | null
  variantes?: Variante[]
  ticketPai?: number
}

interface Vitrine {
  id: number
  nome: string
  produtos: Produto[]
}

const superVitrines = ref<Vitrine[]>([])

const getImageUrl = (url: string) =>
  url?.startsWith('http') ? url : `https://nice-eggs-d79e24d7a7.strapiapp.com${url}`

async function carregarSuperVitrines() {
  try {
    const { data } = await axios.get(
      'https://nice-eggs-d79e24d7a7.strapiapp.com/api/super-vitrines?populate[produtos][populate][0]=fotos&populate[produtos][populate][1]=variantes'
    )
    superVitrines.value = (data.data || []).map((vitrine: any) => ({
      id: vitrine.id,
      nome: vitrine.nome,
      produtos: (vitrine.produtos || []).map((p: any) => ({
        id: p.id,
        nome: p.nome,
        preco: p.preco,
        fotos: (p.fotos || []).map((foto: any) => ({
          url: getImageUrl(foto.url),
          name: foto.name
        })),
        estoqueUnico: p.estoqueUnico ?? null,
        variantes: p.variantes ?? [],
        ticketPai: p.ticketPai
      }))
    }))
  } catch (error) {
    console.error('Erro ao carregar super vitrines:', error)
  }
}

onMounted(() => {
  carregarSuperVitrines()
})
</script>
