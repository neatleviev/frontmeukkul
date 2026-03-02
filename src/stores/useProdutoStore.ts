import { defineStore } from 'pinia'

export const useProdutoStore = defineStore('produto', {
  state: () => ({
    produtoSelecionado: null as any
  }),
  actions: {
    setProdutoSelecionado(produto: any) {
      this.produtoSelecionado = produto
    }
  },
  persist: true
})
