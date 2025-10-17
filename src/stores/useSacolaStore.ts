// stores/useSacolaStore.ts
import { defineStore } from 'pinia'

export const useSacolaStore = defineStore('sacola', {
  state: () => ({
    itens: [] as any[],
    aberto: false
  }),

  actions: {
    adicionarProduto(produto: any) {
      function stringifyNormalized(obj: any) {
  if (!obj) return ''
  const keys = Object.keys(obj).sort()
  const normalized: any = {}
  for (const k of keys) {
    normalized[k] = obj[k]
  }
  return JSON.stringify(normalized)
}

const mesmaVariante = (a: any, b: any) => {
  if (!a && !b) return true
  if (!a || !b) return false

  // use id da variante quando disponível (mais rápido e seguro)
  if (a.id !== undefined && b.id !== undefined) {
    return a.id === b.id
  }

  // fallback: comparação profunda normalizada
  return stringifyNormalized(a) === stringifyNormalized(b)
}


      const existente = this.itens.find(item =>
        item.ticketPai === produto.ticketPai &&
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

      this.abrirCarrinho()
    },

    removerProduto(index: number) {
      this.itens.splice(index, 1)
    },

    limparSacola() {
      this.itens = []
      localStorage.removeItem('sacola')
    },

    abrirCarrinho() {
      this.aberto = true
    },

    fecharCarrinho() {
      this.aberto = false
    },

    
  },

  getters: {
    totalPreco: (state) => {
      return state.itens.reduce((total, item) => {
        const precoItem = item.preco ? item.preco : 0;
        const quantidade = item.quantidadeSelecionada ? item.quantidadeSelecionada : 0;
        return total + (precoItem * quantidade);
      }, 0);
    },
  },

  

  persist: true
})




