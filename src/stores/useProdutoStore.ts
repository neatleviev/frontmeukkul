import { defineStore } from 'pinia'

export const useProdutoStore = defineStore('produto', {
  state: () => ({
    produtosCache: {} as Record<number, any>,
    produtoSelecionado: null as any
  }),

  actions: {
    setProduto(produto: any) {
      const id = produto.ticketPai ?? produto.ticket ?? produto.id
      if (!id) return

      this.produtosCache[id] = produto
      this.produtoSelecionado = produto
    },

    getProduto(id: number) {
      return this.produtosCache[id] ?? null
    }
  },

  persist: true
})