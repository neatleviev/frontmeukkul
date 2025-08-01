// stores/useSacolaStore.ts
import { defineStore } from 'pinia'

export const useSacolaStore = defineStore('sacola', {
  state: () => ({
    itens: [] as any[]
  }),

  actions: {
    adicionarProduto(produto: any) {
      const mesmaVariante = (a: any, b: any) => {
        if (!a && !b) return true
        if (!a || !b) return false
        return (
          a.tamanho === b.tamanho &&
          a.cor === b.cor &&
          a.aroma === b.aroma &&
          a.funcao === b.funcao
        )
      }

      const existente = this.itens.find(item =>
        item.id === produto.id &&
        mesmaVariante(item.selectedVariante, produto.selectedVariante)
      )

      if (existente) {
        existente.quantidadeSelecionada += produto.quantidadeSelecionada
      } else {
        this.itens.push({
          ...produto,
          selectedVariante: produto.selectedVariante ? { ...produto.selectedVariante } : null,
          variantes: produto.variantes ? JSON.parse(JSON.stringify(produto.variantes)) : [],
          quantidadeSelecionada: produto.quantidadeSelecionada || 1,
        })
      }
    },

    removerProduto(index: number) {
      this.itens.splice(index, 1)
    },

    limparSacola() {
      this.itens = [] // reset completo
      localStorage.removeItem('sacola') // limpar persistência manualmente (se persist estiver ativado)
    }
  }

  // ⚠️ Remova o persistente por enquanto:
  // persist: true
})
