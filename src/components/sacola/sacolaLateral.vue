<template>
  <div
    class="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-lg rounded-lg z-50 
           transition-transform duration-300 ease-in-out flex flex-col"
    :class="{ 'translate-x-0': isOpen, 'translate-x-full': !isOpen }"
  >
    <!-- Cabeçalho -->
    <div 
      class="p-4 flex justify-center items-center border-b cursor-pointer 
             bg-stone-950 text-stone-50 
             hover:shadow-[0_0_25px_rgba(213,106,160,0.9)] 
             hover:scale-105 active:scale-105 transition duration-100 ease-in-out rounded-lg"
      @click="fecharSacola"
    >
      <h2 class="text-xl font-bold">Fechar sacola</h2>
    </div>

    <!-- RODAPÉ PRINCIPAL (subtotal / entrega / total / nome) - escondido enquanto overlay estiver ativo -->
    <div v-if="!mostrandoOverlay" class="p-4 border-t space-y-3">
      <p
        v-if="mensagemAviso"
        class="text-center message-strong"
        :class="{ 'animate-blink-strong': mensagemAviso }"
      >
        {{ mensagemAviso }}
      </p>

      <div class="flex items-center justify-between gap-3">
        <p :class="['font-medium', { 'animate-blink-text': subtotal < 15 }]">
          Sem frete: R$ {{ subtotal.toFixed(2) }}
        </p>

        <select
          v-model="opcaoEntrega"
          :class="['border rounded px-2 py-1 text-sm w-1/2 transition-colors duration-200',
                   { 'animate-blink-border': devePiscarEntrega }]"
          aria-label="Modo de entrega"
        >
          <option value="">Selecione um modo de entrega</option>
          <option value="retirada">Vou retirar no Meukkul</option>
          <option value="uber">Uber entrega no Meukkul</option>
          <option value="meukkul">Entrega no Meukkul por (R$ 4,00)</option>
        </select>
      </div>

      <div class="flex items-center justify-between gap-3">
        <p class="font-medium">Total com frete: R$ {{ total.toFixed(2) }}</p>
        <input
          v-model="clienteNome"
          type="text"
          placeholder="Nome completo"
          :class="['border px-3 py-2 rounded text-sm w-1/2 transition-colors duration-200',
                   { 'animate-blink-border': devePiscarNome }]"
          aria-label="Nome completo"
        />
      </div>
    </div>

    <!-- ÁREA CENTRAL: ALERTA / POLÍTICA (sem bordas - ocupa todo o espaço) ou LISTA -->
    <div class="p-4 space-y-4 overflow-y-auto flex-1">
      <!-- ALERTA (sem borda, com linhas internas para separar blocos) -->
      <section v-if="exibindoAlerta" class="w-full">
        <header class="mb-3">
          <h3 class="text-lg font-semibold">Atenção</h3>
        </header>

        <div class="mb-3 border-b pb-3">
          <p class="text-base leading-relaxed font-medium">
            Ao prosseguir com seu pedido na Sextbt, verifique atentamente todos os detalhes dos produtos escolhidos.
          </p>
        </div>

        <div class="mb-3 border-b pb-3">
          <p class="text-base leading-relaxed">
            Certifique-se de imagem, variante e quantidade — isso evita devoluções e garante sua satisfação.
          </p>
        </div>

        <div class="mb-2 text-sm text-gray-500">
          <p>Confirme o alerta para visualizar nossa política completa.</p>
        </div>

        <div class="mt-4 flex items-center justify-end gap-2">
          <button
            class="px-4 py-2 rounded-md text-white bg-pink-500 hover:bg-pink-600"
            @click="confirmarAlerta"
          >
            Li o alerta
          </button>

          <button
            class="px-3 py-2 rounded-md bg-gray-100 text-gray-700"
            @click="cancelarPolitica"
          >
            Cancelar
          </button>
        </div>
      </section>

      <!-- POLÍTICA (sem borda, linhas internas; Voltar agora ao lado de Confirmar e com estilo igual ao Cancelar) -->
      <section v-else-if="exibindoPolitica" class="w-full">
        <header class="mb-3">
          <h3 class="text-lg font-semibold flex items-center gap-2">
            <span class="inline-block bg-red-500 text-white rounded px-2 py-0.5">ATENÇÃO</span>
            Política de Troca & Devolução
          </h3>
        </header>

        <div class="mb-3 border-b pb-3">
          <p class="text-base leading-relaxed font-medium">Sextbt dispõe de política de troca e devolução.</p>
        </div>

        <div class="mb-3 border-b pb-3">
          <p class="text-base leading-relaxed">
            Ao efetuar o pagamento, você concorda com os termos da política. Conservamos o direito de recusar itens com indícios de uso ou violação do lacre.
          </p>
        </div>

        <div class="mb-3 border-b pb-3">
          <p class="text-base leading-relaxed">
            Prazo para solicitação: <strong>1 dia</strong> a partir da entrega. Pode haver taxa de restituição de <strong>R$6</strong>.
          </p>
        </div>

        <!-- Aqui estão os três botões: Voltar (estilo Cancelar), Confirmar (rosa) e Cancelar (estilo Cancelar) -->
        <div class="mt-4 flex items-center justify-end gap-2">
          <button
            class="px-3 py-2 rounded-md bg-gray-100 text-gray-700"
            @click="voltarParaAlerta"
            aria-label="Voltar para alerta"
          >
            Voltar
          </button>

          <button
            class="px-4 py-2 rounded-md text-white bg-pink-500 hover:bg-pink-600"
            @click="confirmarLeitura"
          >
            Confirmar leitura e concordo
          </button>

          <button
            class="px-3 py-2 rounded-md bg-gray-100 text-gray-700"
            @click="cancelarPolitica"
          >
            Cancelar
          </button>
        </div>
      </section>

      <!-- LISTA DE ITENS -->
      <template v-else>
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

              <p v-if="item.selectedVariante?.estoqueVariante !== undefined" class="text-xs text-gray-500">
                Estoque disponível: {{ item.selectedVariante.estoqueVariante }}
              </p>
              <p v-else-if="item.estoqueUnico !== undefined" class="text-xs text-gray-500">
                Estoque disponível: {{ item.estoqueUnico }}
              </p>

              <p class="text-sm font-bold mt-1">
                R$ {{ (item.preco * item.quantidadeSelecionada).toFixed(2) }}
              </p>
            </div>

            <button @click="sacola.removerProduto(index)" class="text-red-500 text-sm cursor-pointer
            hover:scale-105 active:scale-120">Remover</button>
          </div>
        </div>
      </template>
    </div>

    <!-- RODAPÉ INFERIOR (checkbox só aparece quando pré-requisitos OK; botão finalizar como DIV full block) -->
    <footer class="p-4 border-t ">
      <div class="flex flex-col gap-3">
        <!-- checkbox aparece apenas quando os pré-requisitos são atendidos -->
        <label v-if="preRequisitosPolitica" class="inline-flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            v-model="politicaChecked"
            class="mt-1"
            aria-label="Li e concordo com a política de troca e devolução"
          />
          <div>
            <div class="font-medium">Li e concordo com a política de troca e devolução</div>
            <div class="text-xs text-gray-500">Ao marcar, você visualizará nosso alerta e a política e deverá confirmá-la.</div>
          </div>
        </label>

      </div>
    </footer>
    <!-- Botão Finalizar - usa DIV conforme seu bloco (aparece somente quando podeFinalizar E nenhum overlay ativo) -->
    <div
      v-if="!mostrandoOverlay && podeFinalizar"
      class="p-4 flex justify-center items-center cursor-pointer 
             bg-stone-950 text-stone-50 
             hover:shadow-[0_0_25px_rgba(213,106,160,0.9)] 
             hover:scale-105 
             active:scale-105
             active:shadow-[0_0_25px_rgba(213,106,160,0.9)]
             transition duration-100 ease-in-out rounded-lg"
      @click="enviarPedidoParaWhatsApp"
      role="button"
      aria-label="Finalizar Compra"
    >
      Finalizar Compra
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineExpose, watch } from 'vue'
import { useSacolaStore } from '@/stores/useSacolaStore'
import { atualizarEstoqueSacola } from '@/services/strapi'

const sacola = useSacolaStore()
const isOpen = ref(false)
const clienteNome = ref('')
const opcaoEntrega = ref('') // '' => selecione

// fluxo de política
const politicaChecked = ref(false)
const alertaConfirmado = ref(false)
const leituraConfirmada = ref(false)

/* ------------- COMPUTEDS (declarar antes dos watches) ------------- */
const subtotal = computed(() =>
  sacola.itens.reduce((acc, item) => acc + item.preco * item.quantidadeSelecionada, 0)
)

const frete = computed(() => (opcaoEntrega.value === 'meukkul' ? 4 : 0))
const total = computed(() => subtotal.value + frete.value)

const nomeValido = computed(() => {
  const s = clienteNome.value.trim()
  if (!s) return false
  const parts = s.split(/\s+/).filter(Boolean)
  return parts.length >= 2 && parts.every(p => p.length >= 2)
})

const devePiscarEntrega = computed(() => subtotal.value >= 15 && !opcaoEntrega.value)
const devePiscarNome = computed(() => subtotal.value >= 15 && !!opcaoEntrega.value && !nomeValido.value)

// pré-requisitos para liberar a caixinha da política (mesmas regras da finalização sem a leitura)
const preRequisitosPolitica = computed(() => subtotal.value >= 15 && !!opcaoEntrega.value && nomeValido.value)

// exibição de overlays
const exibindoAlerta = computed(() => politicaChecked.value && !alertaConfirmado.value && !leituraConfirmada.value)
const exibindoPolitica = computed(() => politicaChecked.value && alertaConfirmado.value && !leituraConfirmada.value)
const mostrandoOverlay = computed(() => exibindoAlerta.value || exibindoPolitica.value)

/* ------------- WATCHES (após computeds) ------------- */
// reset automático se requisitos mudarem (por exemplo: remover itens, limpar nome, trocar entrega)
watch(preRequisitosPolitica, (v) => {
  if (!v) {
    politicaChecked.value = false
    alertaConfirmado.value = false
    leituraConfirmada.value = false
  }
})

// quando marcar/desmarcar a caixinha, sempre começar pelo alerta
watch(politicaChecked, (v) => {
  if (v) {
    alertaConfirmado.value = false
    leituraConfirmada.value = false
  } else {
    alertaConfirmado.value = false
    leituraConfirmada.value = false
  }
})

/* ------------- REGRAS FINAIS ------------- */
const podeFinalizar = computed(() =>
  subtotal.value >= 15 && !!opcaoEntrega.value && nomeValido.value && leituraConfirmada.value
)

const mensagemAviso = computed(() => {
  if (subtotal.value < 15) return 'O valor mínimo para compra é de R$15,00'
  if (!opcaoEntrega.value) return 'Por favor, selecione um modo de entrega'
  if (!nomeValido.value) return 'Por favor, informe seu nome completo'
  if (!leituraConfirmada.value) return 'Por favor, confirme que leu a política de troca e devolução'
  return ''
})

/* ------------- HELPERS E AÇÕES ------------- */
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

function abrirSacola() { isOpen.value = true }
function fecharSacola() { isOpen.value = false }

// fluxo alerta → política → confirmação
function confirmarAlerta() { alertaConfirmado.value = true }
function voltarParaAlerta() { alertaConfirmado.value = false; leituraConfirmada.value = false }
function confirmarLeitura() { leituraConfirmada.value = true }
function cancelarPolitica() {
  politicaChecked.value = false
  alertaConfirmado.value = false
  leituraConfirmada.value = false
}

/* ------------- FINALIZAR / ATUALIZAR ESTOQUE ------------- */
async function enviarPedidoParaWhatsApp() {
  if (!podeFinalizar.value) return

  const payload = sacola.itens.map((item: any) => {
    if (item.selectedVariante?.ticket) {
      return {
        ticketPai: item.ticketPai,
        ticket: item.selectedVariante.ticket,
        quantidade: item.selectedVariante.estoqueVariante - item.quantidadeSelecionada,
      }
    } else {
      return {
        ticketPai: item.ticketPai,
        quantidade: item.estoqueUnico - item.quantidadeSelecionada,
      }
    }
  })

  try {
    await atualizarEstoqueSacola(payload)

    const textoPedido = sacola.itens
      .map((item: any) =>
        `• ${item.nome} ${
          item.selectedVarante
            ? `(${item.selectedVariante.tamanho || ''} ${item.selectedVariante.cor || ''} ${item.selectedVariante.aroma || ''} ${item.selectedVariante.funcao || ''})`
            : ''
        } - Quantidade: ${item.quantidadeSelecionada}`.replace(/\s+/g, ' ').trim()
      )
      .join('\n')

    const entregaTexto =
      opcaoEntrega.value === 'retirada'
        ? 'Vou retirar no Meukkul'
        : opcaoEntrega.value === 'uber'
        ? 'Uber entrega no Meukkul'
        : 'Entrega no Meukkul (+R$4,00)'

    const linkWhatsapp = `https://wa.me/SEU_NUMERO?text=${encodeURIComponent(
      `Olá, meu nome é ${clienteNome.value}.\nGostaria de fazer um pedido:\n\n${textoPedido}\n\nSubtotal: R$ ${subtotal.value.toFixed(
        2
      )}\nEntrega: ${entregaTexto}\nTotal: R$ ${total.value.toFixed(2)}`
    )}`

    sacola.limparSacola()
    window.open(linkWhatsapp, '_blank')

    setTimeout(() => window.location.reload(), 500)
  } catch (err) {
    console.error('Erro ao finalizar pedido:', err)
    alert('Ocorreu um erro ao atualizar o estoque. Tente novamente.')
  }
}

defineExpose({ abrirSacola, fecharSacola })
</script>

<style scoped>
.translate-x-full { transform: translateX(100%) }
.translate-x-0 { transform: translateX(0%) }

/* pequenas animações visuais limpas */
@keyframes blinkText { 0%,100%{ color:#111827 } 50%{ color:#ef4444 } }
.animate-blink-text { animation: blinkText 1s infinite; }

@keyframes blinkBorder {
  0% { box-shadow: none; border-color: rgba(0,0,0,0.12); }
  50% { box-shadow: 0 0 10px rgba(239,68,68,0.18); border-color: rgba(239,68,68,0.9); }
  100% { box-shadow: none; border-color: rgba(0,0,0,0.12); }
}
.animate-blink-border { animation: blinkBorder 1.4s infinite; }

@keyframes blinkStrong {
  0% { transform: scale(1); text-shadow:none; }
  50% { transform: scale(1.02); text-shadow: 0 6px 18px rgba(239,68,68,0.18); }
  100% { transform: scale(1); text-shadow:none; }
}
.animate-blink-strong { animation: blinkStrong 1s infinite; }

.message-strong {
  color: #000;
  font-weight: 800;
  font-size: 1rem;
  letter-spacing: 0.2px;
}

/* política/alerta: sem borda "card", somente linhas internas (já feitas com border-b nas seções) */
.policy-card { background: transparent; }

/* estilo do botão final (div) para ficar alinhado com seu print */
footer .rounded-lg {
  border-radius: 12px;
}

/* responsividade */
@media (min-width: 640px) {
  .policy-card { max-height: 34rem; }
}
</style>
