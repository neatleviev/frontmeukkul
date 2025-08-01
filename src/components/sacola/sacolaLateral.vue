<template>
  <div
    v-show="isOpen"
    class="fixed top-0 right-0 w-full sm:w-[360px] h-full bg-white shadow-xl z-50 transition-transform duration-300 ease-in-out"
    :class="{ 'translate-x-0': isOpen, 'translate-x-full': !isOpen }"
  >
    <div class="p-4 flex justify-between items-center border-b">
      <h2 class="text-xl font-bold text-gray-800">Sua Sacola</h2>
      <button @click="fecharSacola" class="text-gray-500 hover:text-black">✕</button>
    </div>

    <div class="p-4">
      <div v-if="sacola.itens.length">
        <div
          v-for="(item, index) in sacola.itens"
          :key="index"
          class="flex gap-4 mb-4 border-b pb-4"
        >
          <img
            :src="item.fotos?.[0]?.url"
            alt="Produto"
            class="w-20 h-20 object-contain rounded bg-gray-100"
          />
          <div class="flex-1">
            <div class="flex justify-between items-start">
              <h3 class="text-sm font-semibold text-gray-800">
                {{ item.nome }}
              </h3>
              <button @click="sacola.removerProduto(index)" class="text-xs text-gray-500 underline">
                remover
              </button>
            </div>
            <p class="text-xs text-gray-600 mt-1">
              {{ formatarVariante(item.selectedVariante) }}
            </p>
            <div class="flex items-center gap-2 mt-2">
              <div class="flex border rounded overflow-hidden">
                <button
                  class="px-2 text-sm"
                  @click="item.quantidadeSelecionada > 1 && item.quantidadeSelecionada--"
                >−</button>
                <span class="px-3 text-sm">{{ item.quantidadeSelecionada }}</span>
                <button
                  class="px-2 text-sm"
                  @click="item.quantidadeSelecionada++"
                >+</button>
              </div>
              <div class="ml-auto text-sm text-gray-800 font-semibold">
                R$ {{ (item.preco * item.quantidadeSelecionada).toFixed(2) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center text-sm text-gray-500">
        Sua sacola está vazia.
      </div>

      <div v-if="sacola.itens.length" class="mt-6">
        <input
          v-model="clienteNome"
          type="text"
          placeholder="Digite seu nome"
          class="w-full mb-4 border px-3 py-2 rounded text-sm"
        />

        <button
          @click="enviarPedidoParaWhatsApp"
          class="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded font-semibold text-sm"
        >
          Enviar pedido via WhatsApp
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineExpose } from 'vue'
import { useSacolaStore } from '@/stores/useSacolaStore'
import { criarPedido } from '@/services/strapi'

const sacola = useSacolaStore()
const isOpen = ref(false)
const clienteNome = ref('')

async function enviarPedidoParaWhatsApp() {
  if (!clienteNome.value.trim()) {
    alert('Por favor, insira seu nome antes de enviar o pedido.')
    return
  }

  const numeroWhatsApp = '5592988313548'
  let mensagem = `*Olá, meu nome é ${clienteNome.value} e gostaria de fazer um pedido:*\n\n`

  sacola.itens.forEach((item: any, index: number) => {
    const variacao = formatarVariante(item.selectedVariante)
    const quantidade = item.quantidadeSelecionada
    const precoUnit = item.preco.toFixed(2)
    const subtotal = (item.preco * quantidade).toFixed(2)

    mensagem += `${index + 1}. *${item.nome}*\n`
    if (variacao) mensagem += `   Variação: ${variacao}\n`
    mensagem += `   Quantidade: ${quantidade}\n`
    mensagem += `   Preço unitário: R$ ${precoUnit}\n`
    mensagem += `   Subtotal: R$ ${subtotal}\n\n`
  })

  const total = sacola.itens.reduce((sum: number, item: any) => sum + item.preco * item.quantidadeSelecionada, 0)
  mensagem += `*Total do pedido: R$ ${total.toFixed(2)}*`

  try {
    const pedido = {
      clienteNome: clienteNome.value,
      clienteWhatsapp: '',
      total: Number(total.toFixed(2)),
      andamento: 'pendente',
      enviado: false,
      produtos: sacola.itens.map((item: any) => ({ id: item.id }))
    }

    await criarPedido(pedido)

    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`
    window.open(url, '_blank')

    sacola.limparSacola()
    clienteNome.value = ''

    setTimeout(() => {
      window.location.reload()
    }, 300)
  } catch (error) {
    console.error('Erro ao criar pedido:', error)
  }
}

function formatarVariante(v: any): string {
  if (!v) return ''
  return [v.tamanho, v.cor, v.aroma, v.funcao].filter(Boolean).join(' | ')
}

function abrirSacola() {
  isOpen.value = true
}

function fecharSacola() {
  isOpen.value = false
}

defineExpose({
  abrirSacola,
  fecharSacola
})
</script>

<style scoped>
.translate-x-full {
  transform: translateX(100%);
}
.translate-x-0 {
  transform: translateX(0%);
}
</style>
