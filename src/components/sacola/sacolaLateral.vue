<template>
  <div
    class="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-lg rounded-lg z-50 
           transition-transform duration-300 ease-in-out flex flex-col"
    :class="{ 'translate-x-0': isOpen, 'translate-x-full': !isOpen }"
  >
    <!-- Cabeçalho -->
    <div
  role="button"
  tabindex="0"
  class="p-4 flex items-center justify-between border-b cursor-pointer
         bg-stone-950 text-stone-50
         hover:shadow-[0_0_25px_rgba(213,106,160,0.9)]
         hover:scale-105 active:scale-95 transition duration-100 ease-in-out rounded-lg"
  @click="fecharSacola"
  @keydown.enter.prevent="fecharSacola"
  @keydown.space.prevent="fecharSacola"
>
  <!-- título à esquerda -->
  <h2 class="text-xl font-bold ">
    Fechar sacola
  </h2>

 <!-- preço à direita (stack para mostrar label + valor) -->
  <div class="flex flex-col items-center whitespace-nowrap">
    <span 
      :class="[
        'text-sm font-medium text-green-600 animate-blink-strong'
      ]"
    >
      {{ frete > 0 ? 'Com frete' : 'Sem frete' }}
    </span>
    <span 
      class="text-2xl font-extrabold text-green-600 animate-blink-strong"
    >
      R$ {{ total.toFixed(2) }}
    </span>
  </div>

</div>


    <!-- RODAPÉ PRINCIPAL (subtotal / entrega / total / nome / pagamento) - escondido enquanto overlay estiver ativo -->
    <div v-if="!mostrandoOverlay" class="p-4 border-t space-y-3">
      <p
        v-if="mensagemAviso"
        class="text-center message-strong"
        :class="{ 'animate-blink-strong': mensagemAviso }"
      >
        {{ mensagemAviso }}
      </p>

      <!-- LINHA: subtotal à esquerda / campos de nome-entrega-pagamento à direita (mesma ordem visual solicitada) -->
      <div class="flex items-center justify-between gap-3">
       

        <div class="flex items-center gap-3 flex-1 justify-end">
          <!-- Primeiro: Primeiro nome (libera o select de entrega) -->
          <input
            ref="nomeInputRef"
            v-model="clienteNome"
            type="text"
            placeholder="Primeiro nome"
            :class="[
              'border px-3 py-2 rounded text-sm transition-colors duration-200',
              'w-1/3',
              { 'animate-blink-border': devePiscarNome }
            ]"
            aria-label="Primeiro nome"
            autocomplete="given-name"
          />

          <!-- Segundo: Select Entrega (desabilitado até nome válido) -->
          <select
            ref="entregaSelectRef"
            v-model="selecaoEntregaUI"
            @change="onSelectEntregaChange"
            :disabled="!nomeValido"
            :class="[
              'border rounded px-2 py-1 text-sm transition-colors duration-200 appearance-none',
              'w-1/3',
              'no-focus',
              { 'animate-blink-border': devePiscarEntrega, 'opacity-60 cursor-not-allowed': !nomeValido }
            ]"
            aria-label="Modo de entrega"
          >
            <option value="" disabled>Entrega</option>
            <option value="retirada">Vou retirar no Meukkul</option>
            <option value="uber">Uber entrega no Meukkul</option>
            <option value="meukkul">Entrega no Meukkul por (R$ 4,00)</option>
          </select>

          <!-- Terceiro: Select Pagamento (desabilitado até entrega escolhida) -->
          <select
            ref="pagamentoSelectRef"
            v-model="selecaoPagamentoUI"
            @change="onSelectPagamentoChange"
            :disabled="!opcaoEntrega"
            :class="[
              'border rounded px-2 py-1 text-sm transition-colors duration-200 appearance-none',
              'w-1/3',
              'no-focus',
              { 'animate-blink-border': devePiscarPagamento, 'opacity-60 cursor-not-allowed': !opcaoEntrega }
            ]"
            aria-label="Forma de pagamento"
          >
            <option value="" disabled>Pagamento</option>
            <option value="pix">Pix</option>
            <option value="link">Link de pagamento</option>
            <option value="dinheiro">Dinheiro vivo</option>
            <option value="credito">Cartão de crédito</option>
            <option value="debito">Cartão de débito</option>
          </select>
        </div>
      </div>
    </div>

    <!-- ÁREA CENTRAL: OVERLAYS (entrega / alerta / política / pagamento) OU LISTA -->
    <div class="p-4 space-y-4 overflow-y-auto flex-1">
      <!-- OVERLAY DE ENTREGA -->
      <section v-if="exibindoEntrega" class="w-full">
        <header class="mb-3">
          <h3 class="text-lg font-semibold flex items-center gap-2">
            <span class="inline-block bg-red-500 text-white rounded px-2 py-0.5">ATENÇÃO</span>
            Confirmação do modo de entrega
          </h3>
        </header>

        <div class="mb-3 border-b pb-3">
          <p class="text-base leading-relaxed font-medium">
            Você selecionou: <strong>{{ textoEntrega(entregaPendente) }}</strong>.
          </p>
        </div>

        <div class="mb-3 border-b pb-3" v-if="entregaPendente === 'retirada'">
          <p class="text-base leading-relaxed">
            Ao confirmar, sua compra será preparada para <strong>retirada no Meukkul</strong>. 
            Certifique-se de que seu nome esteja correto e esteja ciente de que <strong>não há entrega</strong> neste modo.
          </p>
        </div>

        <div class="mb-3 border-b pb-3" v-else-if="entregaPendente === 'uber'">
          <p class="text-base leading-relaxed">
            Ao confirmar, você solicita <strong>Uber entrega no Meukkul</strong>. 
            A taxa e o tempo são definidos pela corrida. Manteremos você informado no WhatsApp.
          </p>
        </div>

        <div class="mb-3 border-b pb-3" v-else-if="entregaPendente === 'meukkul'">
          <p class="text-base leading-relaxed">
            Ao confirmar, será aplicada a taxa fixa de <strong>R$ 4,00</strong> da 
            <strong>Entrega no Meukkul</strong>. Certifique-se do endereço e disponibilidade para receber.
          </p>
        </div>

        <div class="mb-2 text-sm text-gray-500">
          <p>Confirme a leitura para aplicar este modo de entrega ao seu pedido.</p>
        </div>

        <div class="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 rounded-md text-white bg-pink-500 hover:bg-pink-600 cursor-pointer confirm-btn entrega-confirm-btn"
            @pointerdown.prevent="confirmarEntrega"
            @click.stop="confirmarEntrega"
            aria-label="Confirmar entrega"
          >
            Confirmar leitura e concordo
          </button>

          <button
            type="button"
            class="px-3 py-2 rounded-md bg-gray-100 text-gray-700 cursor-pointer"
            @pointerdown.prevent="cancelarEntrega"
            @click.stop="cancelarEntrega"
            aria-label="Cancelar entrega"
          >
            Cancelar
          </button>
        </div>
      </section>

      <!-- OVERLAY DE PAGAMENTO -->
      <section v-else-if="exibindoPagamento" class="w-full">
        <header class="mb-3">
          <h3 class="text-lg font-semibold flex items-center gap-2">
            <span class="inline-block bg-blue-500 text-white rounded px-2 py-0.5">INFO</span>
            Confirmação da forma de pagamento
          </h3>
        </header>

        <div class="mb-3 border-b pb-3">
          <p class="text-base leading-relaxed font-medium">
            Você selecionou: <strong>{{ textoPagamento(pagamentoPendente) }}</strong>.
          </p>
        </div>

        <div class="mb-3 border-b pb-3">
          <p v-if="pagamentoPendente === 'pix'">
            Aceitamos Pix. Você pode pagar <strong>no ato da entrega</strong> ou <strong>antecipado via WhatsApp</strong>.
            <span v-if="opcaoEntrega === 'uber'" class="text-red-600 font-semibold">
              No caso de Uber entrega, o pagamento deve ser antecipado pelo WhatsApp.
            </span>
          </p>

          <p v-else-if="pagamentoPendente === 'link'">
            Você receberá um link de pagamento pelo WhatsApp. 
            <span v-if="opcaoEntrega === 'uber'" class="text-red-600">Com Uber entrega, deve ser pago antecipadamente.</span>
          </p>

          <p v-else-if="pagamentoPendente === 'dinheiro'">
            Pagamento em dinheiro vivo. Por favor, prepare o troco.
            <span v-if="opcaoEntrega === 'uber'" class="text-red-600">Não aceito para Uber entrega — escolha Pix ou Link.</span>
          </p>

          <p v-else-if="pagamentoPendente === 'credito' || pagamentoPendente === 'debito'">
            Pagamento por cartão no ato da entrega.
            <span v-if="opcaoEntrega === 'uber'" class="text-red-600">Não disponível para Uber entrega — escolha Pix ou Link.</span>
          </p>

          <p v-else class="text-gray-600">Escolha uma forma de pagamento para ver instruções específicas.</p>
        </div>

        <div class="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 rounded-md text-white bg-pink-500 hover:bg-pink-600 cursor-pointer confirm-btn"
            @pointerdown.prevent="confirmarPagamento"
            @click.stop="confirmarPagamento"
          >
            Confirmar
          </button>

          <button
            type="button"
            class="px-3 py-2 rounded-md bg-gray-100 text-gray-700 cursor-pointer"
            @pointerdown.prevent="cancelarPagamento"
            @click.stop="cancelarPagamento"
          >
            Cancelar
          </button>
        </div>
      </section>

      <!-- ALERTA -->
      <section v-else-if="exibindoAlerta" class="w-full">
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
            type="button"
            class="px-4 py-2 rounded-md text-white bg-pink-500 hover:bg-pink-600 cursor-pointer confirm-btn"
            @pointerdown.prevent="confirmarAlerta"
            @click.stop="confirmarAlerta"
            aria-label="Confirmar alerta"
          >
            Li o alerta
          </button>

          <button
            type="button"
            class="px-3 py-2 rounded-md bg-gray-100 text-gray-700 cursor-pointer"
            @pointerdown.prevent="cancelarPolitica"
            @click.stop="cancelarPolitica"
          >
            Cancelar
          </button>
        </div>
      </section>

      <!-- POLÍTICA -->
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

        <div class="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            class="px-3 py-2 rounded-md bg-gray-100 text-gray-700 cursor-pointer"
            @pointerdown.prevent="voltarParaAlerta"
            @click.stop="voltarParaAlerta"
            aria-label="Voltar para alerta"
          >
            Voltar
          </button>

          <button
            type="button"
            class="px-4 py-2 rounded-md text-white bg-pink-500 hover:bg-pink-600 cursor-pointer confirm-btn"
            @pointerdown.prevent="confirmarLeitura"
            @click.stop="confirmarLeitura"
            aria-label="Confirmar leitura política"
          >
            Confirmar leitura e concordo
          </button>

          <button
            type="button"
            class="px-3 py-2 rounded-md bg-gray-100 text-gray-700 cursor-pointer"
            @pointerdown.prevent="cancelarPolitica"
            @click.stop="cancelarPolitica"
            aria-label="Cancelar politica"
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
                    type="button"
                    class="px-2"
                    @click="item.quantidadeSelecionada > 1 && item.quantidadeSelecionada--"
                  >−</button>
                  <span class="px-3">{{ item.quantidadeSelecionada }}</span>
                  <button
                    type="button"
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

            <button type="button" @click="sacola.removerProduto(index)" class="text-red-500 text-sm cursor-pointer
            hover:scale-105 active:scale-120">Remover</button>
          </div>
        </div>
      </template>
    </div>

    <!-- RODAPÉ INFERIOR -->
    <footer class="p-4 border-t ">
      <div class="flex flex-col gap-3">
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

    <!-- Botão Finalizar (mantive role="button" e aparência) -->
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
import { ref, computed, defineExpose, watch, onMounted, nextTick } from 'vue'
import { useSacolaStore } from '@/stores/useSacolaStore'
import { atualizarEstoqueSacola } from '@/services/strapi'

/* ------------------- STORE E ESTADO BASE ------------------- */
const sacola = useSacolaStore()
const isOpen = ref<boolean>(false)
const clienteNome = ref<string>('')

/* DOM refs para foco */
const nomeInputRef = ref<HTMLInputElement | null>(null)
const entregaSelectRef = ref<HTMLSelectElement | null>(null)
const pagamentoSelectRef = ref<HTMLSelectElement | null>(null)

/* ------------------- NOMES BASE ------------------- */
const nomesBase = ref<Set<string>>(new Set())
onMounted(async () => {
  try {
    const resp = await fetch('/nomes_brasil_15000.json')
    const data: string[] = await resp.json()
    nomesBase.value = new Set(
      data.map((n: string) =>
        n.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
      )
    )
  } catch (err) {
    console.error('Erro ao carregar nomes JSON:', err)
  }
})

/* ------------------- HEURÍSTICA DE NOMES ------------------- */
const ALLOWED_SHORT_NAMES = new Set<string>([
  'lu','li','ana','eva','mia','lia','bia','isa','leo','kai','umi','mei','emi','eri','ami','noa','noe'
])

const NICKNAME_BLACKLIST = new Set<string>([
  'dudu','kaka','kiki','kiko','kika','lulu','titi','tete','nene','nana','didi','bibi'
])

function normalizeName(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[-'’.]/g, '')
    .toLowerCase()
    .trim()
}

function isPlausibleName(n: string): boolean {
  if (n.length < 2 || n.length > 20) return false
  if (!/^[a-z]+$/u.test(n)) return false
  if (!/[aeiou]/u.test(n)) return false
  if (/(.)\1{2,}/u.test(n)) return false
  if (/[bcdfghjklmnpqrstvwxyz]{4,}/u.test(n)) return false
  if (NICKNAME_BLACKLIST.has(n)) return false
  return true
}

function validarPrimeiroNome(input: string): { valido: boolean; motivo?: string } {
  const raw = (input ?? '').trim()
  if (!raw) return { valido: false, motivo: 'Informe seu primeiro nome' }

  const first = raw.split(/\s+/)[0]
  const n = normalizeName(first)

  if (n.length < 2) {
    return { valido: false, motivo: 'O nome deve ter pelo menos 2 letras' }
  }

  if (n.length <= 3) {
    if (!ALLOWED_SHORT_NAMES.has(n)) {
      return { valido: false, motivo: `O nome "${capitalize(first)}" parece inválido ou apelido` }
    }
  } else {
    if (NICKNAME_BLACKLIST.has(n)) {
      return { valido: false, motivo: `O nome "${capitalize(first)}" parece apelido e não é aceito` }
    }
  }

  if (nomesBase.value.size > 0 && !nomesBase.value.has(n)) {
    if (!isPlausibleName(n)) {
      return { valido: false, motivo: `O nome "${capitalize(first)}" não foi encontrado e parece inválido` }
    }
  }

  return { valido: true }
}

/* ------------------- ESTADO (ENTREGA / POLÍTICA / PAGAMENTO) ------------------- */
const selecaoEntregaUI = ref<string>('')
const entregaPendente = ref<string | null>(null)
const opcaoEntrega = ref<string>('')

const politicaChecked = ref<boolean>(false)
const alertaConfirmado = ref<boolean>(false)
const leituraConfirmada = ref<boolean>(false)

/* Pagamento */
const selecaoPagamentoUI = ref<string>('')
const pagamentoPendente = ref<string | null>(null)
const opcaoPagamento = ref<string>('')

/* flags para evitar loops */
const ignoreSelecaoWatcher = ref<boolean>(false)
const ignorePagamentoWatcher = ref<boolean>(false)

/* ------------------- COMPUTEDS ------------------- */
const subtotal = computed<number>(() =>
  sacola.itens.reduce((acc: number, item: any) => acc + item.preco * item.quantidadeSelecionada, 0)
)
const frete = computed<number>(() => (opcaoEntrega.value === 'meukkul' ? 4 : 0))
const total = computed<number>(() => subtotal.value + frete.value)

const nomeValidacao = computed(() => validarPrimeiroNome(clienteNome.value))
const nomeValido = computed<boolean>(() => !!nomeValidacao.value.valido)

const devePiscarEntrega = computed<boolean>(() => subtotal.value >= 15 && !opcaoEntrega.value)
const devePiscarPagamento = computed<boolean>(() => subtotal.value >= 15 && !!opcaoEntrega.value && !opcaoPagamento.value)
const devePiscarNome = computed<boolean>(() => subtotal.value >= 15 && !!opcaoEntrega.value && !!opcaoPagamento.value && !nomeValido.value)

const preRequisitosPolitica = computed<boolean>(() => subtotal.value >= 15 && !!opcaoEntrega.value && nomeValido.value)
const exibindoAlerta = computed<boolean>(() => politicaChecked.value && !alertaConfirmado.value && !leituraConfirmada.value)
const exibindoPolitica = computed<boolean>(() => politicaChecked.value && alertaConfirmado.value && !leituraConfirmada.value)
const exibindoEntrega = computed<boolean>(() => entregaPendente.value !== null)
const exibindoPagamento = computed<boolean>(() => pagamentoPendente.value !== null)
const mostrandoOverlay = computed<boolean>(() => exibindoEntrega.value || exibindoAlerta.value || exibindoPolitica.value || exibindoPagamento.value)

const podeFinalizar = computed<boolean>(() =>
  subtotal.value >= 15 && !!opcaoEntrega.value && nomeValido.value && leituraConfirmada.value && !!opcaoPagamento.value
)

/* mensagem aviso (prioridades) */
const mensagemAviso = computed<string>(() => {
  if (subtotal.value < 15) return 'O valor mínimo para compra é de R$15,00'
  if (!opcaoEntrega.value) return 'Por favor, selecione um modo de entrega'
  if (!opcaoPagamento.value) return 'Por favor, selecione uma forma de pagamento'
  if (!nomeValido.value) return nomeValidacao.value.motivo || 'Informe um nome válido'
  if (!leituraConfirmada.value) return 'Por favor, confirme que leu a política de troca e devolução'
  return ''
})

/* ------------------- WATCHES / NORMALIZAÇÃO NOME ------------------- */
function capitalize(raw = '') {
  if (!raw) return ''
  const r = String(raw)
  return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase()
}

watch(clienteNome, (novo: string) => {
  if (!novo) return
  const first = novo.split(/\s+/)[0] ?? ''
  const formatted = capitalize(first)
  if (formatted !== novo) {
    nextTick(() => {
      clienteNome.value = formatted
    })
  }
})

/* Observação importante:
   Removi o foco programático no select de entrega quando o nome fica válido,
   conforme solicitado ("retire o focu dos select entrega e pagamento").
   A ordem de liberação (nome -> entrega -> pagamento) permanece intacta.
*/

/* Select entrega: manter a UX (blur + flag para watchers) */
function onSelectEntregaChange(e: Event) {
  const target = e.target as HTMLSelectElement
  const novo = target.value
  if (!novo) return
  entregaPendente.value = novo

  ;(document.activeElement as HTMLElement | null)?.blur?.()

  ignoreSelecaoWatcher.value = true
  nextTick(() => {
    selecaoEntregaUI.value = opcaoEntrega.value || ''
    setTimeout(() => { ignoreSelecaoWatcher.value = false }, 0)
  })
}

watch(selecaoEntregaUI, (novo: string) => {
  if (ignoreSelecaoWatcher.value) return
  if (!novo) return
  entregaPendente.value = novo
})

/* Select pagamento: mesma dinâmica que entrega */
function onSelectPagamentoChange(e: Event) {
  const target = e.target as HTMLSelectElement
  const novo = target.value
  if (!novo) return
  pagamentoPendente.value = novo

  ;(document.activeElement as HTMLElement | null)?.blur?.()

  ignorePagamentoWatcher.value = true
  nextTick(() => {
    selecaoPagamentoUI.value = opcaoPagamento.value || ''
    setTimeout(() => { ignorePagamentoWatcher.value = false }, 0)
  })
}

watch(selecaoPagamentoUI, (novo: string) => {
  if (ignorePagamentoWatcher.value) return
  if (!novo) return
  pagamentoPendente.value = novo
})

watch(preRequisitosPolitica, (v: boolean) => {
  if (!v) {
    politicaChecked.value = false
    alertaConfirmado.value = false
    leituraConfirmada.value = false
  }
})

watch(politicaChecked, (v: boolean) => {
  if (v) {
    alertaConfirmado.value = false
    leituraConfirmada.value = false
  } else {
    alertaConfirmado.value = false
    leituraConfirmada.value = false
  }
})

/* ------------------- FUNÇÕES UTILITÁRIAS ------------------- */
function textoEntrega(valor: string | null): string {
  if (valor === 'retirada') return 'Vou retirar no Meukkul'
  if (valor === 'uber') return 'Uber entrega no Meukkul'
  if (valor === 'meukkul') return 'Entrega no Meukkul (+R$4,00)'
  return ''
}
function textoPagamento(v: string | null): string {
  if (v === 'pix') return 'Pix'
  if (v === 'link') return 'Link de pagamento'
  if (v === 'dinheiro') return 'Dinheiro vivo'
  if (v === 'credito') return 'Cartão de crédito'
  if (v === 'debito') return 'Cartão de débito'
  return ''
}
function getEstoqueDisponivel(item: any): number {
  if (item.selectedVariante?.estoqueVariante !== undefined) {
    return item.selectedVarante.estoqueVariante
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

/* ------------------- FLUXOS (ENTREGA / POLÍTICA / PAGAMENTO) ------------------- */
function confirmarEntrega() {
  if (!entregaPendente.value) return
  opcaoEntrega.value = entregaPendente.value
  selecaoEntregaUI.value = opcaoEntrega.value
  entregaPendente.value = null

  // se entrega = uber e já havia forma incompatível, limpar forma de pagamento para forçar reescolha
  if (opcaoEntrega.value === 'uber' && opcaoPagamento.value && ['dinheiro','credito','debito'].includes(opcaoPagamento.value)) {
    opcaoPagamento.value = ''
    selecaoPagamentoUI.value = ''
  }

  // removido o foco programático no select de pagamento conforme pedido
}
function cancelarEntrega() {
  entregaPendente.value = null
}

function confirmarAlerta() { alertaConfirmado.value = true }
function voltarParaAlerta() { alertaConfirmado.value = false; leituraConfirmada.value = false }
function confirmarLeitura() { leituraConfirmada.value = true }
function cancelarPolitica() {
  politicaChecked.value = false
  alertaConfirmado.value = false
  leituraConfirmada.value = false
}

/* Pagamento: confirma com regra de Uber (antecipado obrigatorio) */
function confirmarPagamento() {
  if (!pagamentoPendente.value) return

  // Se Uber está selecionado, exigir Pix ou Link
  if (opcaoEntrega.value === 'uber' && ['dinheiro','credito','debito'].includes(pagamentoPendente.value)) {
    alert('Para Uber entrega, o pagamento deve ser antecipado via WhatsApp — escolha Pix ou Link de pagamento.')
    return
  }

  opcaoPagamento.value = pagamentoPendente.value
  selecaoPagamentoUI.value = opcaoPagamento.value
  pagamentoPendente.value = null
}
function cancelarPagamento() {
  pagamentoPendente.value = null
}

/* ------------------- FINALIZAR PEDIDO ------------------- */
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
          item.selectedVariante
            ? `(${item.selectedVariante.tamanho || ''} ${item.selectedVariante.cor || ''} ${item.selectedVariante.aroma || ''} ${item.selectedVariante.funcao || ''})`
            : ''
        } - Quantidade: ${item.quantidadeSelecionada}`.replace(/\s+/g, ' ').trim()
      )
      .join('\n')

    const entregaTexto = textoEntrega(opcaoEntrega.value || null)
    const pagamentoTexto = textoPagamento(opcaoPagamento.value || null)

    const linkWhatsapp = `https://wa.me/SEU_NUMERO?text=${encodeURIComponent(
      `Olá, meu nome é ${clienteNome.value}.\nGostaria de fazer um pedido:\n\n${textoPedido}\n\nSubtotal: R$ ${subtotal.value.toFixed(
        2
      )}\nEntrega: ${entregaTexto}\nPagamento: ${pagamentoTexto}\nTotal: R$ ${total.value.toFixed(2)}`
    )}`

    sacola.limparSacola()
    window.open(linkWhatsapp, '_blank')
    setTimeout(() => window.location.reload(), 500)
  } catch (err) {
    console.error('Erro ao finalizar pedido:', err)
    alert('Ocorreu um erro ao atualizar o estoque. Tente novamente.')
  }
}

/* ------------------- Expose para pai ------------------- */
defineExpose({ abrirSacola, fecharSacola })
</script>

<style scoped>
.translate-x-full { transform: translateX(100%) }
.translate-x-0 { transform: translateX(0%) }

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

.policy-card { background: transparent; }

footer .rounded-lg {
  border-radius: 12px;
}

.confirm-btn {
  cursor: pointer;
  box-shadow: none;
}
.confirm-btn:focus {
  outline: 3px solid rgba(213,106,160,0.18);
  outline-offset: 2px;
}

/* Removendo o contorno visual de foco especificamente para os selects
   (classe aplicada: .no-focus)
*/
.no-focus:focus {
  outline: none !important;
  box-shadow: none !important;
}

/* Se quiser manter acessibilidade, remova o !important e adapte conforme necessidade.
   O pedido foi "retire o focu dos select entrega e pagamento" — por isso deixei o estilo acima.
*/

@media (min-width: 640px) {
  .policy-card { max-height: 34rem; }
}


</style>
