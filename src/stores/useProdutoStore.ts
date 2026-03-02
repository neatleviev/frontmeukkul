import { defineStore } from 'pinia'

export const useProdutoStore = defineStore('produto', {
  state: () => ({
    // Não persistimos "produtoSelecionado" para evitar abrir produto antigo
    // quando o cliente entra por link direto (/produto/:id).
    produtoSelecionado: null as any
  }),
  actions: {
    setProdutoSelecionado(produto: any) {
      this.produtoSelecionado = produto
    },
    clearProdutoSelecionado() {
      this.produtoSelecionado = null
    }
  }
})