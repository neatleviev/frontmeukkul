<template>
  <div
    class="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-lg z-50 transition-transform duration-300 ease-in-out"
    :class="{ 'translate-x-0': carrinho.aberto, 'translate-x-full': !carrinho.aberto }"
  >
    <div class="p-4 flex justify-between items-center border-b">
      <h2 class="text-xl font-bold text-[#d56aa0]">Sacola</h2>
      <button @click="carrinho.fecharCarrinho">✕</button>
    </div>

    <div class="p-4 space-y-4 overflow-y-auto h-[calc(100%-150px)]">
      <div
        v-for="(item, index) in carrinho.itens"
        :key="index"
        class="border-b pb-4"
      >
        <div class="flex gap-4">
          <img
            :src="item.fotos?.[0]?.url"
            class="w-16 h-16 object-contain rounded"
            alt=""
          />
          <div class="flex-1">
            <p class="font-semibold">{{ item.nome }}</p>
            <p class="text-sm text-gray-500">{{ formatarVariante(item.selectedVariante) }}</p>
            <p class="text-sm">Qtd: {{ item.quantidade }}</p>
            <p class="text-sm font-bold">R$ {{ (item.preco * item.quantidade).toFixed(2) }}</p>
          </div>
          <button @click="carrinho.removerProduto(index)" class="text-red-500">Remover</button>
        </div>
      </div>
    </div>

    <div class="p-4 border-t space-y-3">
      <p class="font-medium">Subtotal: R$ {{ carrinho.subtotal.toFixed(2) }}</p>
      <button class="w-full py-2 bg-black text-white rounded">Finalizar Compra</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCarrinhoStore } from '@/stores/useCarrinhoStore'
const carrinho = useCarrinhoStore()

function formatarVariante(v: any): string {
  if (!v) return ''
  return `${v.tamanho || ''} ${v.cor ? '| ' + v.cor : ''}`
}
</script>

<style scoped>
.translate-x-full {
  transform: translateX(100%);
}
.translate-x-0 {
  transform: translateX(0%);
}
</style>
