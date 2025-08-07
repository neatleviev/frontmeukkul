<template>
  <div
    class="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-lg z-50 transition-transform duration-300 ease-in-out"
    :class="{ 'translate-x-0': isOpen, 'translate-x-full': !isOpen }"
  >
    <div class="p-4 flex justify-between items-center border-b">
      <h2 class="text-xl font-bold text-[#d56aa0]">Sacola</h2>
      <button @click="fecharSacola">X</button>
    </div>

    <div class="p-4 space-y-4 overflow-y-auto h-[calc(100%-200px)]">
      <div
        v-for="(item, index) in sacola.itens"
        :key="index"
        class="border-b pb-4"
      >
        <div class="flex gap-4">
          <img
            :src="item.fotos?.[0]?.url"
            class="w-16 h-16 object-contain rounded"
            alt="Produto"
          />
          <div class="flex-1">
            <p class="font-semibold">{{ item.nome }}</p>
            <p class="text-sm text-gray-500">{{ formatarVariante(item.selectedVariante) }}</p>

            <div class="flex items-center gap-2 my-1">
              <div class="flex border rounded overflow-hidden text-sm">
                <button
                  class="px-2"
                  @click="item.quantidadeSelecionada > 1 && item.quantidadeSelecionada--"
                >−</button>
                <span class="px-3">{{ item.quantidadeSelecionada }}</span>
                <button
                  class="px-2"
                  :disabled="item.quantidadeSelecionada >= getEstoqueDisponivel(item)"
                  @click="item.quantidadeSelecionada++"
                >+</button>
              </div>
            </div>

            <p
              v-if="item.selectedVariante?.estoqueVariante !== undefined"
              class="text-xs text-gray-500"
            >
              Estoque disponível: {{ item.selectedVariante.estoqueVariante }}
            </p>
            <p
              v-else-if="item.estoqueUnico !== undefined"
              class="text-xs text-gray-500"
            >
              Estoque disponível: {{ item.estoqueUnico }}
            </p>

            <p class="text-sm font-bold mt-1">
              R$ {{ (item.preco * item.quantidadeSelecionada).toFixed(2) }}
            </p>
          </div>

          <button @click="sacola.removerProduto(index)" class="text-red-500 text-sm">Remover</button>
        </div>
      </div>
    </div>

    <div class="p-4 border-t space-y-3">
      <input
        v-model="clienteNome"
        type="text"
        placeholder="Digite seu nome"
        class="w-full border px-3 py-2 rounded text-sm"
      />

      <p class="font-medium">
        Subtotal: R$ {{ subtotal.toFixed(2) }}
      </p>

      <button
        class="w-full py-2 bg-black text-white rounded"
        @click="enviarPedidoParaWhatsApp"
      >
        Finalizar Compra
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineExpose } from 'vue'
import { useSacolaStore } from '@/stores/useSacolaStore'
import { atualizarEstoqueSacola } from '@/services/strapi'

const sacola = useSacolaStore()
const isOpen = ref(false)
const clienteNome = ref('')

const subtotal = computed(() =>
  sacola.itens.reduce(
    (acc, item) => acc + item.preco * item.quantidadeSelecionada,
    0
  )
)

function getEstoqueDisponivel(item: any): number {
  if (item.selectedVariante?.estoqueVariante !== undefined) {
    return item.selectedVariante.estoqueVariante
  }
  if (item.estoqueUnico !== undefined) {
    return item.estoqueUnico
  }
  return Infinity
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
async function enviarPedidoParaWhatsApp() {
  if (sacola.itens.length === 0) {
    alert('Sua sacola está vazia.');
    return;
  }

  const payload = sacola.itens.map(item => {
  if (item.selectedVariante?.ticket) {
    return {
      ticketPai: item.ticketPai,
      ticket: item.selectedVariante.ticket,
      quantidade: item.selectedVariante.estoqueVariante-item.quantidadeSelecionada,
    }
  } else {
    return {
      ticketPai: item.ticketPai,
      quantidade: item.estoqueUnico-item.quantidadeSelecionada,
    }
  }
})


  try {
    // Atualizar estoque no Strapi
    await atualizarEstoqueSacola(payload);

    // Montar mensagem do WhatsApp
    const textoPedido = sacola.itens
      .map(
        (item) =>
          `• ${item.nome} ${
            item.selectedVariante
              ? `(${item.selectedVariante.tamanho || ''} ${item.selectedVariante.cor || ''} ${item.selectedVariante.aroma || ''} ${item.selectedVariante.funcao || ''})`
              : ''
          } - Quantidade: ${item.quantidadeSelecionada}`
      )
      .join('\n');

    const linkWhatsapp = `https://wa.me/SEU_NUMERO?text=${encodeURIComponent(
      `Olá, gostaria de fazer um pedido:\n\n${textoPedido}`
    )}`;

    // Limpa a sacola
    sacola.limparSacola();

    // Abre o WhatsApp
    window.open(linkWhatsapp, '_blank');

    // Aguarda um pouco e recarrega a página
    setTimeout(() => {
      window.location.reload();
    }, 500); // tempo suficiente para abrir o WhatsApp antes do reload
  } catch (error) {
    console.error('Erro ao finalizar pedido:', error);
    alert('Ocorreu um erro ao atualizar o estoque. Tente novamente.');
  }
}




defineExpose({ abrirSacola, fecharSacola })
</script>

<style scoped>
.translate-x-full {
  transform: translateX(100%);
}
.translate-x-0 {
  transform: translateX(0%);
}
</style>

