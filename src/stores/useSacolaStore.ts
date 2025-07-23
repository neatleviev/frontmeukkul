import { defineStore } from 'pinia'

export const useSacolaStore = defineStore('sacola', {
  state: () => ({
    itens: [] as any[]
  }),
  actions: {
    adicionarProduto(produto: any) {
      const idBase = produto.id
      const idVariante = produto.selectedVariante?.id || null

      const existente = this.itens.find(item =>
        item.id === idBase &&
        item.selectedVariante?.id === idVariante
      )

      if (existente) {
        existente.quantidadeSelecionada += produto.quantidadeSelecionada
      } else {
        this.itens.push({ ...produto })
      }
    },

    removerProduto(index: number) {
      this.itens.splice(index, 1)
    }
  }
})
