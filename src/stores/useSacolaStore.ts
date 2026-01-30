// stores/useSacolaStore.ts
import { defineStore } from 'pinia'

export const useSacolaStore = defineStore('sacola', {
  state: () => ({
    itens: [] as any[],
    aberto: false,
    avisoBrinde: '' as string
  }),

  getters: {
    totalPreco: (state) => {
      return state.itens.reduce((total, item) => {
        const precoItem = Number(item?.preco ?? 0)
        const quantidade = Number(item?.quantidadeSelecionada ?? 0)
        return total + (precoItem * quantidade)
      }, 0)
    },

    // Total sem contar brindes (preço 0 ou isBrinde)
    subtotalSemBrindes: (state) => {
      return state.itens.reduce((total, item) => {
        const precoItem = Number(item?.preco ?? 0)
        const quantidade = Number(item?.quantidadeSelecionada ?? 0)
        const isBrinde = precoItem === 0 || item?.isBrinde === true
        if (isBrinde) return total
        if (precoItem <= 0) return total
        return total + (precoItem * quantidade)
      }, 0)
    },

    // Regra: < 60 => prateleira 199 | >= 60 => prateleira 200
    brindeElegivelPrateleiraId(): number {
      return this.subtotalSemBrindes >= 60 ? 200 : 199
    }
  },

  actions: {
    // helper: origem/prateleira do item (não depende de rota!)
    getOrigemPrateleiraId(item: any): number | null {
      const origem =
        item?.origemPrateleiraId ??
        item?.prateleiraId ??
        item?.prateleira_id ??
        item?.prateleira?.id ??
        item?.prateleira?.data?.id

      const n = Number(origem)
      return Number.isFinite(n) && n > 0 ? n : null
    },

    removerBrindesInvalidosSeNecessario(motivo?: string) {
      const elegivel = this.brindeElegivelPrateleiraId

      // remove brindes que não batem com a elegibilidade atual
      for (let i = this.itens.length - 1; i >= 0; i--) {
        const it = this.itens[i]
        const preco = Number(it?.preco ?? 0)
        const isBrinde = preco === 0 || it?.isBrinde === true
        if (!isBrinde) continue

        const origem = this.getOrigemPrateleiraId(it)
        if (origem !== elegivel) {
          this.itens.splice(i, 1)
        }
      }

      if (motivo) this.avisoBrinde = motivo
    },

    adicionarProduto(produto: any) {
      // --- funções que você já tinha, mantidas ---
      function stringifyNormalized(obj: any) {
        if (!obj) return ''
        const keys = Object.keys(obj).sort()
        const normalized: any = {}
        for (const k of keys) normalized[k] = obj[k]
        return JSON.stringify(normalized)
      }

      const mesmaVariante = (a: any, b: any) => {
        if (!a && !b) return true
        if (!a || !b) return false

        if (a.id !== undefined && b.id !== undefined) return a.id === b.id

        return stringifyNormalized(a) === stringifyNormalized(b)
      }
      // --- fim das funções mantidas ---

      const preco = Number(produto?.preco ?? 0)
      const isBrinde = preco === 0 || produto?.isBrinde === true

      // ---------------------------
      // TRATAMENTO DE BRINDE
      // ---------------------------
      if (isBrinde) {
        const origem = this.getOrigemPrateleiraId(produto)
        const elegivel = this.brindeElegivelPrateleiraId

        // sempre 1 unidade
        const produtoBrinde = {
          ...produto,
          quantidadeSelecionada: 1,
          isBrinde: true
        }

        if (!origem) {
          this.avisoBrinde = 'Brinde indisponível: origem inválida.'
          return
        }

        if (origem !== elegivel) {
          if (elegivel === 200 && origem === 199) {
            this.avisoBrinde = 'Este brinde é liberado a partir de R$ 60.'
          } else if (elegivel === 199 && origem === 200) {
            this.avisoBrinde = 'Este brinde é exclusivo para compras a partir de R$ 60.'
          } else {
            this.avisoBrinde = 'Brinde indisponível para esta compra.'
          }
          return
        }

        // remove qualquer brinde anterior (só pode 1)
        for (let i = this.itens.length - 1; i >= 0; i--) {
          const it = this.itens[i]
          const p = Number(it?.preco ?? 0)
          const itIsBrinde = p === 0 || it?.isBrinde === true
          if (itIsBrinde) this.itens.splice(i, 1)
        }

        // adiciona brinde
        this.itens.push({
          ...produtoBrinde,
          selectedVariante: produtoBrinde.selectedVariante ? { ...produtoBrinde.selectedVariante } : null,
          variantes: produtoBrinde.variantes ? JSON.parse(JSON.stringify(produtoBrinde.variantes)) : []
        })

        this.avisoBrinde = ''
        this.abrirCarrinho()
        return
      }

      // ---------------------------
      // PRODUTO NORMAL (mantém seu fluxo)
      // ---------------------------
      const existente = this.itens.find((item) =>
        item.ticketPai === produto.ticketPai &&
        mesmaVariante(item.selectedVariante, produto.selectedVariante)
      )

      if (existente) {
        existente.quantidadeSelecionada += (produto.quantidadeSelecionada || 1)
      } else {
        this.itens.push({
          ...produto,
          selectedVariante: produto.selectedVariante ? { ...produto.selectedVariante } : null,
          variantes: produto.variantes ? JSON.parse(JSON.stringify(produto.variantes)) : [],
          quantidadeSelecionada: produto.quantidadeSelecionada || 1
        })
      }

      // se ao adicionar produto o carrinho mudou de faixa (<60 / >=60),
      // remove brinde inválido automaticamente (sem depender de página)
      this.removerBrindesInvalidosSeNecessario()

      this.abrirCarrinho()
    },

    removerProduto(index: number) {
      this.itens.splice(index, 1)
      this.removerBrindesInvalidosSeNecessario()
    },

    limparSacola() {
      this.itens = []
      this.avisoBrinde = ''
      localStorage.removeItem('sacola')
    },

    abrirCarrinho() {
      this.aberto = true
    },

    fecharCarrinho() {
      this.aberto = false
    }
  },

  persist: true
})
