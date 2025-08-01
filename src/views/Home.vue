<template>
  <section class="p-4 space-y-8">
    <div
      v-for="vitrine in superVitrines"
      :key="vitrine.id"
      class="space-y-4"
    >
      <h2 class="text-2xl font-bold text-[#d56aa0]">
        {{ vitrine.nome }}
      </h2>

      <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <cardProduto
          v-for="produto in vitrine.produtos"
          :key="produto.id"
          :product="produto"
        />
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import cardProduto from '@/components/cardProduto.vue'

interface Foto {
  url: string
  name: string
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
  estoqueUnico?: number
  variantes?: Variante[]
  ticketPai: number
}

interface Vitrine {
  id: number
  nome: string
  produtos: Produto[]
}

const superVitrines = ref<Vitrine[]>([])

const getImageUrl = (url: string) =>
  url?.startsWith('http') ? url : `https://nice-eggs-d79e24d7a7.strapiapp.com${url}`

onMounted(async () => {
  try {
    const { data } = await axios.get(
      'https://nice-eggs-d79e24d7a7.strapiapp.com/api/super-vitrines?populate[produtos][populate][0]=fotos&populate[produtos][populate][1]=variantes'
    )

    superVitrines.value = data.data.map((vitrine: any) => ({
      id: vitrine.id,
      nome: vitrine.nome,
      produtos: vitrine.produtos.map((p: any) => ({
        id: p.id,
        nome: p.nome,
        preco: p.preco,
        fotos: p.fotos?.map((foto: any) => ({
          url: getImageUrl(foto.url),
          name: foto.name
        })) ?? [],
        estoqueUnico: p.estoqueUnico,
        variantes: p.variantes ?? [],
        ticketPai: p.ticketPai
      }))
    }))
  } catch (error) {
    console.error('Erro ao carregar super vitrines:', error)
  }
})
</script>

