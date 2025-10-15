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
            :disabled="subtotal < 15"
            :class="[
              'border px-3 py-2 rounded text-sm transition-colors duration-200',
              'w-1/3',
              { 'opacity-60 cursor-not-allowed': subtotal < 15, 'animate-blink-border': devePiscarNome }
            ]"
            aria-label="Primeiro nome"
            autocomplete="given-name"
          />

          <!-- Segundo: Select Entrega (desabilitado até nome válido) -->
          <div class="relative w-1/3">
            <select
              ref="entregaSelectRef"
              v-model="selecaoEntregaUI"
              @change="onSelectEntregaChange"
              :disabled="!nomeValido"
              :class="[
                'select-modern no-focus transition-colors duration-200 appearance-none pr-8',
                { 'animate-blink-border': devePiscarEntrega, 'opacity-60 cursor-not-allowed': !nomeValido }
              ]"
              aria-label="Modo de entrega"
            >
              <option value="" disabled>Entrega</option>
              <!-- Mantemos os CODES internos, só ajustamos os rótulos para refletir o Strapi -->
              <option value="retirada">Vou retirar no Meukkul</option>
              <option value="uber">Uber entrega no Meukkul</option>
              <option value="meukkul">Entrega no Meukkul por (RS: 4,00)</option>
            </select>
            <!-- seta customizada (não interfere em acessibilidade) -->
            <span class="select-arrow pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <path d="M6 7L10 11L14 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </div>

          <!-- Terceiro: Select Pagamento (desabilitado até entrega escolhida) -->
          <div class="relative w-1/3">
            <select
              ref="pagamentoSelectRef"
              v-model="selecaoPagamentoUI"
              @change="onSelectPagamentoChange"
              :disabled="!opcaoEntrega"
              :class="[
                'select-modern no-focus transition-colors duration-200 appearance-none pr-8',
                { 'animate-blink-border': devePiscarPagamento, 'opacity-60 cursor-not-allowed': !opcaoEntrega }
              ]"
              aria-label="Forma de pagamento"
            >
              <option value="" disabled>Pagamento</option>
              <option value="pix">Pix</option>
              <option value="link">Link de pagamento</option>
              <option value="dinheiro">Dinheiro Vivo</option>
              <option value="credito">Cartão de Crédito</option>
              <!-- REMOVIDO débito do front, conforme Strapi -->
            </select>
            <span class="select-arrow pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <path d="M6 7L10 11L14 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ÁREA CENTRAL: OVERLAYS (entrega / alerta / política / pagamento) OU LISTA -->
    <div class="p-4 space-y-4 overflow-y-auto flex-1">
      <!-- OVERLAY DE ENTREGA -->
      <section v-if="exibindoEntrega" class="w-full">
               

        <div class="mb-3 border-b pb-3" v-if="entregaPendente === 'retirada'">
          <p style="text-align: center; font-weight: 500; line-height: 1.6;">
  <strong style="font-size: 1.3em;">Retirada no Meukkul</strong><br><br>
  Nesse modo de entrega, você vem até a nossa <strong>localização</strong> 
  para realizar a retirada do seu pedido. 
  O endereço pode ser consultado diretamente com nossa atendente pelo WhatsApp 
  após a finalização da sua compra.<br><br>
  Nossos horários de retirada são das <strong>14h30 às 22h00</strong>.
</p>




        </div>

        <div class="mb-3 border-b pb-3" v-else-if="entregaPendente === 'uber'">
          <p style="text-align: center; font-weight: 500; line-height: 1.6;">
  <strong style="font-size: 1.3em;">Uber Entrega no Meukkul</strong><br><br>
  Nesse modo de entrega, você solicita o serviço de entrega pelo aplicativo da 
  <strong>Uber</strong> ou <strong>99 Pop</strong>.<br><br>
  • Na descrição do item a ser entregue, adicione a informação 
  <strong>"produto íntimo frágil"</strong> e o <strong>valor total da sua compra</strong>.<br><br>
  • Assim que o motoboy for confirmado no aplicativo, envie para nós os 
  <strong>detalhes do motorista</strong> (print da placa ou link de acompanhamento) 
  para que possamos monitorar o envio.<br><br>
  • O pagamento deve ser realizado <strong>antes de solicitar o Uber Entrega</strong> 
  ou <strong>99 Entrega</strong>, garantindo que o processo ocorra de forma rápida e eficiente.<br><br>
  A <strong>localização</strong> pode ser consultada diretamente com nossa atendente 
  pelo <strong>WhatsApp</strong> após a finalização da sua compra.<br><br>
  Nossos horários de atendimento e retirada são das <strong>14h30 às 22h00</strong>.
</p>



        </div>

        <div class="mb-3 border-b pb-3" v-else-if="entregaPendente === 'meukkul'">
         <p style="text-align: center; font-weight: 500; line-height: 1.6;">
  <strong style="font-size: 1.3em;">Entrega no Meukkul por R$4,00</strong><br><br>
  Nesse modo de entrega, contamos com um <strong>sistema de rota única</strong>, 
  onde nosso entregador realiza as entregas pelo valor fixo de <strong>R$4,00</strong>, válido apenas para entregas <strong>dentro do território de Manaus</strong>.<br><br>
  <strong>Atenção:</strong> aceitamos pedidos até as <strong>15h30</strong> 
  para a montagem da rota, que tem <strong>saída do Meukkul a partir das 16h30</strong>.<br><br>
  Nosso sistema de rota funciona de <strong>terça a sábado</strong>.
</p>


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
        

        

        <div class="mb-3 border-b pb-3">
        <p v-if="pagamentoPendente === 'pix'" style="text-align: center; font-weight: 500; line-height: 1.6;">
  <strong style="font-size: 1.3em;">Pagamento via PIX</strong><br><br>
  Nesse modo de pagamento, você pode realizar o pagamento no 
  <strong>ato da entrega</strong> caso tenha escolhido as opções 
  <strong>Entrega no Meukkul por R$4,00</strong> ou 
  <strong>Vou retirar no Meukkul</strong>.<br><br>
  Se você optou pelo modo <strong>Uber Entrega</strong>, 
  o pagamento deve ser realizado <strong>de forma antecipada</strong>.
</p>



          <p v-else-if="pagamentoPendente === 'link'" style="text-align: center; font-weight: 500; line-height: 1.6;">
            <strong style="font-size: 1.3em;">Link de pagamento</strong><br><br>
            Nesse modo de pagamento, você receberá um link seguro. 
            Ao acessá-lo, basta preencher os dados do seu cartão de crédito 
            e concluir o pagamento, que pode ser parcelado em até <strong>12 vezes</strong> com acrecimo da operadora.<br><br>
            
          </p>


<p v-else-if="pagamentoPendente === 'dinheiro'" style="text-align: center; font-weight: 500; line-height: 1.6;">
  <strong style="font-size: 1.3em;">Dinheiro vivo</strong><br><br>
  Nesse modo de pagamento, você realiza o pagamento em dinheiro (notas físicas). 
  <strong>Atenção:</strong> as notas devem estar em boas condições, sem rasgos ou danos, 
  pois precisamos depositá-las no banco e o sistema automático não aceita notas danificadas.<br><br>
  <span v-if="opcaoEntrega === 'uber'" class="text-red-600">
    Esse modo <strong>não pode ser escolhido</strong> se você selecionou a opção de entrega via Uber (entrega no Meukkul).
  </span>
</p>


         <p v-else-if="pagamentoPendente === 'credito'" style="text-align: center; font-weight: 500; line-height: 1.6;">
  <strong style="font-size: 1.3em;">Cartão de Crédito</strong><br><br>
  Nesse modo de pagamento, você realiza o pagamento presencialmente, no momento da entrega, 
  utilizando o seu cartão de crédito. 
  <strong>Atenção:</strong> o cartão deve possuir a função de aproximação (NFC), 
  pois utilizamos um sistema de pagamento com tecnologia embarcada em smartphones.<br><br>
  <span v-if="opcaoEntrega === 'uber'" class="text-red-600">
    Esse modo <strong>não pode ser escolhido</strong> se você selecionou a opção de entrega via Uber (entrega no Meukkul).
  </span>
</p>



          <p v-else class="text-gray-600">Escolha uma forma de pagamento para ver instruções específicas.</p>
        </div>

        <div class="mt-4 flex itens-center justify-end gap-2">
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
        
        <div class="mb-3 border-b pb-3">
          <p style="text-align: center; font-weight: 500; line-height: 1.6;">
  <strong style="font-size: 1.3em;">Prezado cliente,</strong><br><br>
  Ao realizar seu pedido na Sextbt, pedimos que verifique cuidadosamente todos os detalhes dos produtos escolhidos por você. 
  Caso haja dúvidas, por favor, não hesite em questionar nossa atendente, 
  pois temos uma política de troca e devolução. 
  Devido a isso, você pode enfrentar burocracias administrativas para solucionar qualquer inconveniente.
</p>

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
        <p style="text-align: center; font-weight: 500; line-height: 1.6;">
        <strong style="font-size: 1.3em;">Política de Troca e Devolução - Meukkul</strong><br><br>
        A Meukkul possui uma política de troca e devolução. 
        Ao realizar o pagamento, você concorda com os termos da política da loja.<br><br>
        Por se tratar de produtos íntimos, prezamos pela saúde e higiene de nossos clientes. 
        Não é possível entregar produtos que tenham sido utilizados por terceiros. 
        Portanto, para continuarmos oferecendo a qualidade Meukkul, 
        apenas alguns produtos são passíveis de troca e devolução.<br><br>
        É importante ressaltar que o cliente tem o prazo de até <strong>1 dia</strong> a partir da entrega 
        para solicitar a troca ou devolução. 
        Além disso, o cliente fica ciente de que será necessário pagar uma taxa de <strong>R$6,00</strong> 
        para evitar maiores prejuízos com o frete.<br><br>
        Observem que apenas produtos que contenham <strong>lacre de segurança</strong> 
        (ou seja, produtos com a embalagem intacta, da mesma forma em que foram entregues, 
        e que não tenham sido violados) podem ser trocados ou devolvidos. 
        Dessa forma, garantimos que o produto está intacto e não foi utilizado, 
        podendo ser revendido com segurança a outra pessoa.
      </p>


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
                    :disabled="item.preco === 0 || item.quantidadeSelecionada >= getEstoqueDisponivel(item)"
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

            <button type="button" @click="removerProdutoCustom(index, item)" class="text-red-500 text-sm cursor-pointer
            hover:scale-105 active:scale-120">Remover</button>
          </div>
        </div>
      </template>
    </div>

    <!-- RODAPÉ INFERIOR -->
    <footer class="p-4 border-t ">
      <div class="flex flex-col gap-3">
        <label v-if="preRequisitosPolitica && opcaoPagamento" class="inline-flex items-start gap-3 cursor-pointer select-none policy-card p-2 rounded-md border">
          <input
            type="checkbox"
            v-model="politicaChecked"
            class="mt-1"
            aria-label="Li e concordo com a política de troca e devolução"
          />
          <div>
            <div class="font-medium">
              <span v-if="!leituraConfirmada">Leia os termos para ver se concorda</span>
              <span v-else>Li a política, estou ciente e concordo</span>
            </div>
            <div class="text-xs text-gray-500">
              <span v-if="!leituraConfirmada">Ao marcar, você visualizará nosso alerta e a política e deverá confirmá-la.</span>
              <span v-else>Você já confirmou a política.</span>
            </div>
          </div>
        </label>
      </div>
    </footer>

    <!-- NOVA DIV: Meu Brinde (mostra antes de liberar Finalizar) -->
    <div
      v-if="!mostrandoOverlay && podeFinalizar && !brindeLiberado"
      class="p-4 flex justify-center items-center cursor-pointer 
             bg-stone-950 text-stone-50 
             hover:shadow-[0_0_25px_rgba(213,106,160,0.9)] 
             hover:scale-105 
             active:scale-105
             active:shadow-[0_0_25px_rgba(213,106,160,0.9)]
             transition duration-100 ease-in-out rounded-lg"
      @pointerdown.prevent="onMeuBrindePointerDown"
      @click.stop="onMeuBrindeClick"
      role="button"
      aria-label="Meu Brinde"
    >
      Escolhe meu brinde 🥰
    </div>

    <!-- Botão Finalizar (agora só aparece após brindeLiberado) -->
    <div
      v-if="!mostrandoOverlay && podeFinalizar && brindeLiberado"
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
      Finalizar Minha Compra
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineExpose, watch, onMounted, nextTick, onBeforeUnmount  } from 'vue'
import { useRouter, useRoute  } from 'vue-router'
import { useSacolaStore } from '@/stores/useSacolaStore'
import { atualizarEstoqueSacola, buscarProdutoPorTicketPai, criarPedidoStrapi, mapEntregaToEnum, mapPagamentoToEnum } from '@/services/strapi'
const route = useRoute()



/* ------------------- STORE E ESTADO BASE ------------------- */
const sacola = useSacolaStore()
const isOpen = ref<boolean>(false)

// controla abertura automática com debounce (evita múltiplos rapid-fire)
let abrirTimeout: ReturnType<typeof setTimeout> | null = null


const clienteNome = ref<string>('')

/* router para redirecionar para a view de brindes */
const router = useRouter()

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
const selecaoEntregaUI = ref<string>('')         // codes: 'retirada'|'uber'|'meukkul'
const entregaPendente = ref<string | null>(null)
const opcaoEntrega = ref<string>('')

const politicaChecked = ref<boolean>(false)
const alertaConfirmado = ref<boolean>(false)
const leituraConfirmada = ref<boolean>(false)

/* Pagamento */
const selecaoPagamentoUI = ref<string>('')       // codes: 'pix'|'link'|'dinheiro'|'credito'
const pagamentoPendente = ref<string | null>(null)
const opcaoPagamento = ref<string>('')

/* flags para evitar loops */
const ignoreSelecaoWatcher = ref<boolean>(false)
const ignorePagamentoWatcher = ref<boolean>(false)

/* ------------------- NOVO FLAG: controle de liberação do botão finalizar após "meu brinde" ------------------- */
const brindeLiberado = ref<boolean>(false)

// ID destino que o botão "Escolher meu brinde" deve navegar
// será definido automaticamente ao detectar travessias do limiar.
// Valores possíveis: 191 (prateleira de brindes padrão) ou 194 (brinde para >=60)
const brindeTargetId = ref<number | null>(null)


/* ------------------- AVISO EXTRA ------------------- */
const avisoExtra = ref<string>('') // usado para mensagens temporárias (ex: quando precisa escolher brinde novamente)

/* ------------------- COMPUTEDS ------------------- */
const subtotal = computed<number>(() =>
  sacola.itens.reduce((acc: number, item: any) => acc + item.preco * item.quantidadeSelecionada, 0)
)
const frete = computed<number>(() => (opcaoEntrega.value === 'meukkul' ? 4 : 0))
const total = computed<number>(() => subtotal.value + frete.value)

const nomeValidacao = computed(() => validarPrimeiroNome(clienteNome.value))
const nomeValido = computed<boolean>(() => !!nomeValidacao.value.valido)

/* Novo: campo de aviso baseado na mesma priorização da mensagemAviso (mapeia para os campos) */
const avisoCampo = computed<'nome' | 'entrega' | 'pagamento' | null>(() => {
  // não sinalizamos se for avisoExtra ou aviso de valor mínimo/política
  if (avisoExtra.value) return null
  if (subtotal.value < 15) return null
  if (!nomeValido.value) return 'nome'
  if (!opcaoEntrega.value) return 'entrega'
  if (!opcaoPagamento.value) return 'pagamento'
  return null
})

const devePiscarEntrega = computed<boolean>(() => avisoCampo.value === 'entrega')
const devePiscarPagamento = computed<boolean>(() => avisoCampo.value === 'pagamento')
const devePiscarNome = computed<boolean>(() => avisoCampo.value === 'nome')

const preRequisitosPolitica = computed<boolean>(() => subtotal.value >= 15 && !!opcaoEntrega.value && nomeValido.value)
const exibindoAlerta = computed<boolean>(() => politicaChecked.value && !alertaConfirmado.value && !leituraConfirmada.value)
const exibindoPolitica = computed<boolean>(() => politicaChecked.value && alertaConfirmado.value && !leituraConfirmada.value)
const exibindoEntrega = computed<boolean>(() => entregaPendente.value !== null)
const exibindoPagamento = computed<boolean>(() => pagamentoPendente.value !== null)
const mostrandoOverlay = computed<boolean>(() => exibindoEntrega.value || exibindoAlerta.value || exibindoPolitica.value || exibindoPagamento.value)

/* agora o botão 'Finalizar' depende também de brindeLiberado no template (via v-if),
   então mantenho a lógica de validação original em 'podeFinalizar' */
const podeFinalizar = computed<boolean>(() =>
  subtotal.value >= 15 && !!opcaoEntrega.value && nomeValido.value && leituraConfirmada.value && !!opcaoPagamento.value
)

/* mensagem aviso (prioridades) 
   OBS: reordenei para priorizar o aviso de nome não preenchido antes de entrega/pagamento,
   e adicionei avisoExtra no topo (mensagens temporárias como "escolha o brinde novamente"). */
const mensagemAviso = computed<string>(() => {
  if (avisoExtra.value) return avisoExtra.value
  if (subtotal.value < 15) return 'O valor mínimo para compra é de R$15,00'
  if (!nomeValido.value) return nomeValidacao.value.motivo || 'Informe um nome válido'
  if (!opcaoEntrega.value) return 'Por favor, selecione um modo de entrega'
  if (!opcaoPagamento.value) return 'Por favor, selecione uma forma de pagamento'
  if (!leituraConfirmada.value) return 'Por favor, confirme que leu a política de troca e devolução'
  return ''
})


// WATCHERS



// marca brindeLiberado somente quando há efetivamente um item de preço zero na sacola
watch(
  () => sacola.itens.map((it: any) => Number(it.preco)), // depende da forma como sua store expõe itens
  (listaPrecos) => {
    const temBrinde = listaPrecos.some(p => Number(p) === 0)
    brindeLiberado.value = temBrinde
    // opcional: aviso se necessário
    if (!temBrinde) {
      avisoExtra.value = '' // limpa aviso extra se existir
    }
  },
  { immediate: true, deep: true }
)



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

/* Quando nomeValido transitar de false -> true, focar e abrir o select de entrega */
watch(nomeValido, (novo: boolean, antigo: boolean) => {
  if (novo && !antigo) {
    nextTick(() => {
      // foco e tentativa de abrir o select nativo
      if (entregaSelectRef.value) {
        openNativeSelect(entregaSelectRef.value)
      }
    })
  }
})

/* Select entrega */
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

/* Select pagamento */
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

/* quando os pré-requisitos políticos desaparecerem, resetamos flags incluindo brindeLiberado */
watch(preRequisitosPolitica, (v: boolean) => {
  if (!v) {
    politicaChecked.value = false
    alertaConfirmado.value = false
    leituraConfirmada.value = false
    brindeLiberado.value = false
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

/* opcional: se a sacola ficar vazia, também garantimos resetar brindeLiberado */
watch(
  () => sacola.itens.length,
  (len: number, oldLen: number | undefined) => {
    // se ficou vazio, resetamos brindeLiberado (comportamento já existente)
    if (len === 0) {
      brindeLiberado.value = false
    }

    // abrir automaticamente somente quando houve um aumento no número de itens
    // (protege contra inicialização ou substituições)
    if (typeof oldLen !== 'undefined' && len > oldLen) {
      // limpa timeout anterior se houver
      if (abrirTimeout) {
        clearTimeout(abrirTimeout)
        abrirTimeout = null
      }
      // delay pequeno para dar tempo de updates/animations; ajuste se quiser
      abrirTimeout = setTimeout(() => {
        abrirSacola()
        abrirTimeout = null
      }, 120) // 120ms — ajuste entre 0~300ms conforme preferir
    }
  }
)





// limpar timeout ao desmontar
onBeforeUnmount(() => {
  if (abrirTimeout) clearTimeout(abrirTimeout)
})


/* ------------------- FUNÇÕES UTILITÁRIAS ------------------- */
function textoEntrega(valor: string | null): string {
  if (valor === 'retirada') return 'Vou retirar no Meukkul'
  if (valor === 'uber') return 'Uber entrega no Meukkul'
  if (valor === 'meukkul') return 'Entrega no Meukkul por (RS: 4,00)'
  return ''
}
function textoPagamento(v: string | null): string {
  if (v === 'pix') return 'Pix'
  if (v === 'link') return 'Link de pagamento'
  if (v === 'dinheiro') return 'Dinheiro Vivo'
  if (v === 'credito') return 'Cartão de Crédito'
  return ''
}
function getEstoqueDisponivel(item: any): number {
  if (item.selectedVariante?.estoqueVariante !== undefined) {
    return item.selectedVariante.estoqueVariante // (fix do typo selectedVarante)
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

/* ---------- Função utilitária para focar e tentar abrir selects nativos ---------- */
/* Observação: abrir select programaticamente é limitado por navegadores; fazemos as tentativas
   más seguras: focus(), dispatch de eventos de teclado ('ArrowDown', ' '), e click() como fallback. */
function openNativeSelect(el: HTMLSelectElement | null) {
  if (!el) return
  try { el.focus({ preventScroll: true } as any) } catch { try { el.focus() } catch {} }
  // dispatch eventos de teclado para tentar abrir o dropdown
  try {
    const ev1 = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
    el.dispatchEvent(ev1)
    const ev2 = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
    el.dispatchEvent(ev2)
  } catch (e) {
    // ignore
  }
  // fallback: .click()
  try { el.click() } catch (e) {}
}

/* ------------------- FLUXOS (ENTREGA / POLÍTICA / PAGAMENTO) ------------------- */
function confirmarEntrega() {
  if (!entregaPendente.value) return
  opcaoEntrega.value = entregaPendente.value
  selecaoEntregaUI.value = opcaoEntrega.value
  entregaPendente.value = null

  // se entrega = uber e já havia forma incompatível, limpar forma de pagamento para forçar reescolha
  if (opcaoEntrega.value === 'uber' && opcaoPagamento.value && ['dinheiro','credito'].includes(opcaoPagamento.value)) {
    opcaoPagamento.value = ''
    selecaoPagamentoUI.value = ''
  }

  // Após confirmar entrega, focar e abrir select de pagamento para que o usuário escolha
  nextTick(() => {
    // leve timeout para garantir que o select esteja habilitado/renderizado
    setTimeout(() => {
      if (pagamentoSelectRef.value) openNativeSelect(pagamentoSelectRef.value)
    }, 60)
  })
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

/* Pagamento */
function confirmarPagamento() {
  if (!pagamentoPendente.value) return

  // Uber exige pagamento antecipado (Pix/Link)
  if (opcaoEntrega.value === 'uber' && ['dinheiro','credito'].includes(pagamentoPendente.value)) {
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

/* ------------------- NOVAS FUNÇÕES: Meu Brinde ------------------- */
function onMeuBrindePointerDown(e: PointerEvent) {
  // previne foco estranho / duplo clique; comportamento intencionalmente simples
  e.preventDefault()
}

function onMeuBrindeClick() {
  // Antes de redirecionar, verifica e remove qualquer brinde existente na sacola
  // (evita duplicates / conflito)
  removerProdutosPrecoZero()

  // Se o fluxo anterior definiu explicitamente o destino, usa ele; senão,
  // mantém compatibilidade com a regra original (total >= 60 => 194, else 191)
  const prateleiraId = brindeTargetId.value ?? (total.value >= LIMIAR_BRINDE ? 194 : 191)

  // fechar a sacola e direcionar para a prateleira de brindes apropriada
  fecharSacola()
  try {
    router.push({ name: 'brindes', params: { id: String(prateleiraId) } })
  } catch (err) {
    // fallback: log para debug
    console.warn('Erro ao navegar para a prateleira de brindes:', err)
  }
}





/* ------------------- FINALIZAR PEDIDO ------------------- */
async function enviarPedidoParaWhatsApp() {
  if (!podeFinalizar.value) return

  // Abre uma aba em branco antes dos awaits para evitar bloqueio de pop-up
  const previewWin = window.open('', '_blank')

  try {
    // (1) Atualiza estoque - mantém sua lógica
    const estoquePayload = sacola.itens.map((item: any) => {
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
      await atualizarEstoqueSacola(estoquePayload)
    } catch (err) {
      console.error('Erro ao atualizar estoque (Strapi):', err)
      alert('Ocorreu um erro ao atualizar o estoque. Tente novamente.')
      if (previewWin && !previewWin.closed) previewWin.close()
      return
    }

    // (2) Monta itens_sacola
    const itensSacola = await Promise.all(
      sacola.itens.map(async (item: any) => {
        const produto = await buscarProdutoPorTicketPai(item.ticketPai)
        const produtoId = produto?.id
        if (!produtoId) {
          throw new Error(`Produto com ticketPai ${item.ticketPai} não encontrado no Strapi`)
        }

        const base: any = {
          quantidade: Number(item.quantidadeSelecionada),
          preco: Number((item.preco * item.quantidadeSelecionada).toFixed(2)),
          ticketPai: Number(item.ticketPai),
        }
        if (item.selectedVariante?.ticket) {
          base.ticket = Number(item.selectedVariante.ticket)
        }
        return base
      })
    )

    // (3) Enums de entrega/pagamento
    const entregaEnum = mapEntregaToEnum(opcaoEntrega.value)
    const pagamentoEnum = mapPagamentoToEnum(opcaoPagamento.value)

    // (4) Cria pedido no Strapi
    const payload: any = {
      primeiroNome: clienteNome.value,
      andamento: 'pendente',
      entrega: entregaEnum,
      pagamento: pagamentoEnum,
      itens_sacola: itensSacola,
    }
    if (frete.value > 0) {
      payload.comFrete = Number(total.value.toFixed(2))
    } else {
      payload.semFrete = Number(subtotal.value.toFixed(2))
    }

    const pedidoCriado = await criarPedidoStrapi(payload)

    // Extrai código único (resiliente a formatos Strapi)
    const extrairCodigoUnico = (res: any) => {
      if (!res) return null
      if (res.data?.attributes?.codigo_unico) return res.data.attributes.codigo_unico
      if (res?.codigo_unico) return res.codigo_unico
      if (res?.data?.codigo_unico) return res.data.codigo_unico
      if (res?.attributes?.codigo_unico) return res.attributes.codigo_unico
      if (res?.data?.id) return String(res.data.id)
      if (res?.id) return String(res.id)
      return null
    }

    const codigoUnico = extrairCodigoUnico(pedidoCriado) || 'sem-codigo'
    const primeiroNome = (clienteNome.value || '').trim().split(' ')[0] || 'Cliente'

    // =========================
    // COPIAR PRO CLIPBOARD
    // =========================
    const copyToClipboard = async (text: string): Promise<boolean> => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text)
          return true
        } else {
          // fallback antigo
          const ta = document.createElement('textarea')
          ta.value = text
          // evita scroll jump
          ta.style.position = 'fixed'
          ta.style.left = '-9999px'
          document.body.appendChild(ta)
          ta.focus()
          ta.select()
          const ok = document.execCommand('copy')
          document.body.removeChild(ta)
          return !!ok
        }
      } catch (e) {
        console.warn('Erro ao copiar para clipboard:', e)
        return false
      }
    }

    const copiou = await copyToClipboard(codigoUnico)

    // Mostra uma mensagem curta na janela aberta para feedback (não bloqueante)
    if (previewWin && !previewWin.closed) {
      try {
        previewWin.document.body.style.fontFamily = 'system-ui, Arial, sans-serif'
        previewWin.document.body.style.padding = '16px'
        previewWin.document.body.innerHTML = copiou
          ? `<div style="font-size:14px">Código <strong>${codigoUnico}</strong> copiado para a área de transferência.<br>Redirecionando para o WhatsApp...</div>`
          : `<div style="font-size:14px">Não foi possível copiar automaticamente.<br>Código: <strong>${codigoUnico}</strong><br>Redirecionando para o WhatsApp...</div>`
      } catch (e) {
        // se houver cross-origin later (após redirecionar) vai falhar — ignoramos
      }
    }

    // (5) Monta a mensagem (inline code para fácil cópia manual, mas agora o código já está no clipboard)
    const mensagem = [
      `Oi, me chamo ${primeiroNome}! 👋`,
      ``,
      `Realizei um pedido com o código \`${codigoUnico}\`.`,
      ``,
      `Li todos os termos e regras e quero seguir com minha compra.`
      
    ].join('\n')

    // (6) Abre WhatsApp
    const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '5592999913621'
    const phoneDigits = (WHATSAPP_NUMBER || '').replace(/\D/g, '')

    if (phoneDigits.length < 10) {
      alert(`Número de WhatsApp inválido: ${phoneDigits}`)
      if (previewWin && !previewWin.closed) previewWin.close()
      return
    }

    const waUrl = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(mensagem)}`
    if (previewWin && !previewWin.closed) {
      // redireciona a janela previamente criada
      previewWin.location.href = waUrl
    } else {
      window.open(waUrl, '_blank')
    }

    // (7) Limpa sacola e UI
    sacola.limparSacola()
    resetarFormulario()
    fecharSacola()

  } catch (err) {
    console.error('Erro ao criar pedido / abrir WhatsApp:', err)
    if (previewWin && !previewWin.closed) previewWin.close()
    alert('Ocorreu um erro ao processar seu pedido.')
  }
}






/* ------------------- Regras ESPECÍFICAS DE BRINDE / PREÇO ZERO ------------------- */

/**
 * Regras implementadas:
 * 1) Permitir apenas 1 produto com preco === 0 (se houver mais, removemos os extras).
 * 2) Se existir produto com preco === 0, garantir quantidadeSelecionada === 1.
 * 3) Usar apenas `total` para detectar travessia do limiar (>= 60) — se atravessar, removemos brindes de custo zero e liberamos a div "Escolhe meu brinde".
 * 4) Se, após o clique em "Escolhe meu brinde", o `total` aumentar (usuário adicionou produto com valor > 0 ou qualquer aumento no total),
 *    então disponibilizamos a div "Escolhe meu brinde" novamente (brindeLiberado = false) e exibimos um aviso temporário ao usuário.
 */

/* track previous valores para detectar transição de limiar (USANDO APENAS total conforme solicitado) */
const prevTotal = ref<number>(total.value)
const LIMIAR_BRINDE = 60.0


// watcher: reagir quando o subtotal diminuir — removemos APENAS brindes explicitamente identificados
watch(
  () => subtotal.value,
  (novoSubtotal, velhoSubtotal) => {
    try {
      // Só reagir se diminuiu
      if (novoSubtotal >= velhoSubtotal) return

      // lista de prateleiras que caracterizam brindes VIP (se aplicável)
      const prateleirasVIP = ['194'] // mantenha/ajuste conforme sua regra de negócio
      const prateleirasPermitidasParaBrindeGratis = ['191'] // idem

      // utilitária
      function extractPrateleiraIdFrom(item: any): string {
        return String(
          item?.prateleiraId ??
          item?.prateleira_id ??
          item?.prateleiraIdStr ??
          item?.prateleira?.data?.id ??
          item?.prateleira?.id ??
          item?.origemPrateleiraId ??
          ''
        )
      }

      // construir lista de índices a remover — com critérios estritos:
      // - item.isBrinde === true  (explicitamente marcado)
      // - OU item.preco === 0 e prateleira NÃO for permitida
      const toRemove: number[] = []
      sacola.itens.forEach((item: any, idx: number) => {
        try {
          const prateleiraId = extractPrateleiraIdFrom(item) || String(route?.params?.id ?? '')
          const precoNum = Number(item?.preco ?? NaN)
          const isPrecoZero = !Number.isNaN(precoNum) && precoNum === 0
          const flaggedBrinde = Boolean(item?.isBrinde) === true
          const isVipBrinde = prateleirasVIP.includes(prateleiraId)
          const isBrindePermitido = prateleirasPermitidasParaBrindeGratis.includes(prateleiraId)

          // Regra de remoção: somente se for explicitamente marcado como brinde
          // OU (preço 0 e NÃO estiver em prateleira permitida)
          if (flaggedBrinde || (isPrecoZero && !isBrindePermitido) || isVipBrinde) {
            // adicional: só remover se o subtotal atual realmente ficou abaixo do limiar
            if (novoSubtotal < LIMIAR_BRINDE) {
              toRemove.push(idx)
            }
          }
        } catch (e) {
          console.warn('watch(subtotal): erro ao analisar item', idx, e)
        }
      })

      if (toRemove.length === 0) return

      // Segurança: se for tentar remover tudo, abortar e notificar em vez de apagar tudo
      if (toRemove.length >= sacola.itens.length) {
        console.warn('watch(subtotal): listagem de remoção cobre toda a sacola — abortando para segurança.', { toRemoveLength: toRemove.length, sacolaLength: sacola.itens.length })
        avisoExtra.value = 'Alteração no subtotal detectada — verifique sua sacola antes de confirmar.'
        setTimeout(() => {
          if (avisoExtra.value?.startsWith('Alteração no subtotal detectada')) avisoExtra.value = ''
        }, 5000)
        return
      }

      // remover do fim para o início para preservar índices
      toRemove.sort((a,b) => b - a).forEach(idx => {
        try {
          sacola.removerProduto(idx)
        } catch (err) {
          console.warn('Erro ao remover produto na posição', idx, err)
        }
      })

      // atualiza estado visual
      brindeLiberado.value = false
      avisoExtra.value = 'Brinde removido — subtotal abaixo de R$60.'
      setTimeout(() => {
        if (avisoExtra.value === 'Brinde removido — subtotal abaixo de R$60.') avisoExtra.value = ''
      }, 3500)
    } catch (err) {
      console.error('Erro no watcher de subtotal (refatorado):', err)
    }
  }
)



// ---- Fim: remoção reativa de brindes VIP quando subtotal cair ----



// ---- Início: proteção contra adição de brindes VIP quando subtotal < LIMIAR_BRINDE ----
watch(
  () => sacola.itens.length,
  (len: number, oldLen: number | undefined) => {
    try {
      // Só nos interessa quando houve uma adição
      if (oldLen === undefined || len <= oldLen) return

      const lastIndex = sacola.itens.length - 1
      if (lastIndex < 0) return

      const lastItem: any = sacola.itens[lastIndex]

      // ------------------------------------------------------------------
      // Função utilitária para extrair prateleiraId em múltiplos formatos
      // ------------------------------------------------------------------
      function extractPrateleiraIdFrom(item: any) {
        return String(
          item?.prateleiraId ??
          item?.prateleira_id ??
          item?.prateleiraIdStr ??
          item?.prateleira?.data?.id ??
          item?.prateleira?.id ??
          item?.origemPrateleiraId ??
          ''
        )
      }

      // ------------------------------------------------------------------
      // Identificação da prateleira
      // ------------------------------------------------------------------
      const rawPrateleiraId = extractPrateleiraIdFrom(lastItem)
      // Fallback: se o item não tiver ID de prateleira, usa o da rota atual
      const itemPrateleiraId = rawPrateleiraId || String(route?.params?.id ?? '')

      // ------------------------------------------------------------------
      // Regras de brinde e VIP
      // ------------------------------------------------------------------
      const isPrecoZero = Number(lastItem.preco) === 0

      // Prateleiras bloqueadas (VIP)
      const prateleirasVIP = ['194']

      // Prateleiras liberadas para brindes grátis
      const prateleirasPermitidasParaBrindeGratis = ['191']

      // Regra final: só é considerado "VIP bloqueado" se for da prateleira 194
      // ou se for brinde gratuito fora da prateleira 191
      const isVipBrinde =
        prateleirasVIP.includes(itemPrateleiraId) ||
        (isPrecoZero && !prateleirasPermitidasParaBrindeGratis.includes(itemPrateleiraId)) ||
        Boolean(lastItem?.isBrinde)

      // ------------------------------------------------------------------
      // Se for brinde VIP e subtotal abaixo do limite → remove e notifica
      // ------------------------------------------------------------------
      if (isVipBrinde && subtotal.value < LIMIAR_BRINDE) {
        try {
          sacola.removerProduto(lastIndex)
        } catch (err) {
          console.warn('Erro ao remover brinde inválido (watch adição):', err)
        }

        avisoExtra.value = `Brinde VIP bloqueado. Falta R$ ${(LIMIAR_BRINDE - subtotal.value).toFixed(2)} no carrinho.`

        setTimeout(() => {
          if (avisoExtra.value?.startsWith('Brinde VIP bloqueado')) avisoExtra.value = ''
        }, 4500)
      }
    } catch (e) {
      console.warn('Proteção de brinde (adição) falhou:', e)
    }
  }
)

// ---- Fim: proteção contra adição de brindes VIP quando subtotal < LIMIAR_BRINDE ----

function removerProdutosPrecoZero() {
  // Prateleiras onde brindes grátis são permitidos (não removemos itens nessas prateleiras)
  const prateleirasPermitidasParaBrindeGratis = ['191']

  // Função utilitária: extrai id da prateleira do item (tenta vários campos)
  function extractPrateleiraIdFrom(item: any) {
    return String(
      item?.prateleiraId ??
      item?.prateleira_id ??
      item?.prateleiraIdStr ??
      item?.prateleira?.data?.id ??
      item?.prateleira?.id ??
      item?.origemPrateleiraId ??
      ''
    )
  }

  // id da rota atual (fallback)
  const rotaAtualId = String(route?.params?.id ?? '')

  // índices que serão removidos (armazenar primeiro, remover depois)
  const indices: number[] = []

  sacola.itens.forEach((item: any, idx: number) => {
    try {
      const rawId = extractPrateleiraIdFrom(item)
      const prId = rawId || rotaAtualId || ''

      // parse seguro do preço
      const precoNum = Number(item?.preco ?? NaN)
      const isPrecoZero = !Number.isNaN(precoNum) && precoNum === 0

      // identificação ESTRITA de brinde:
      // - preferimos flag explícita item.isBrinde === true
      // - ou ainda: preço === 0 e prateleira NÃO é permitida para brinde grátis
      const flaggedBrinde = Boolean(item?.isBrinde) === true
      const isBrindePermitido = prateleirasPermitidasParaBrindeGratis.includes(prId)

      if (flaggedBrinde || (isPrecoZero && !isBrindePermitido)) {
        indices.push(idx)
      }
    } catch (e) {
      console.warn('removerProdutosPrecoZero: erro ao analisar item na posição', idx, e)
    }
  })

  if (indices.length === 0) return

  // Segurança adicional: se por algum motivo os índices para remoção
  // corresponderem a praticamente toda a sacola (ex.: mesmo tamanho),
  // abortamos para evitar remoção acidental total e logamos para investigar.
  if (indices.length >= sacola.itens.length) {
    console.warn('removerProdutosPrecoZero: tentativa de remover toda a sacola detectada — abortando para segurança.', {
      sacolaCount: sacola.itens.length,
      indices
    })
    // notificar o usuário de forma leve (não apagar tudo automaticamente)
    avisoExtra.value = 'Detectado possível conflito ao remover brindes — verifique sua sacola.'
    setTimeout(() => {
      if (avisoExtra.value?.startsWith('Detectado possível conflito')) avisoExtra.value = ''
    }, 5000)
    return
  }

  // Remover do fim para o início (preserva índices)
  indices.sort((a,b) => b - a).forEach(i => {
    try {
      sacola.removerProduto(i)
    } catch (err) {
      console.warn('Erro ao remover produto de preço zero (não permitido):', err)
    }
  })
}




function garantirUnicoBrindeEQuantidade() {
  // encontra todos os indices de itens com preco 0
  const prateleirasPermitidasParaBrindeGratis = ['191']

const zeroIndices: number[] = []
sacola.itens.forEach((item: any, idx: number) => {
  const prId = String(item.prateleiraId ?? item.prateleira_id ?? item.prateleiraIdStr ?? '')
  // só conta como 'preço zero' para remoção/normalização se não for de prateleira liberada
  if (Number(item.preco) === 0 && !prateleirasPermitidasParaBrindeGratis.includes(prId)) zeroIndices.push(idx)
})

  if (zeroIndices.length === 0) return

  // garantir somente um: manter o primeiro, remover o resto
  if (zeroIndices.length > 1) {
    const toRemove = zeroIndices.slice(1).sort((a,b)=>b-a)
    toRemove.forEach(i => {
      try { sacola.removerProduto(i) } catch (err) { console.warn('Erro ao remover brinde extra', err) }
    })
  }

  // garantir quantidade = 1 no brinde restante
  const firstIdx = zeroIndices[0]
  const item = sacola.itens[firstIdx]
  if (item) {
    if (item.quantidadeSelecionada > 1) {
      // ajusta para 1
      item.quantidadeSelecionada = 1
    }
    // opcional: prevenir incrementos subsequentes já feito no template (botão + desabilitado para preco 0)
  }
}

/* detecta transição de <LIMIAR para >=LIMIAR e vice-versa usando apenas total
   Comportamento desejado:
   - < 60 -> >= 60: NÃO redirecionar automaticamente; abrir sacola, exibir mensagem,
                   mostrar botão "Escolher meu brinde" e setar brindeTargetId = 194
   - >= 60 -> < 60: NÃO redirecionar automaticamente; remover brindes inválidos,
                   mostrar botão "Escolher meu brinde" e setar brindeTargetId = 191
*/
function checarTransicaoLimiar(prev: number, atual: number) {
  const antesMenor = prev < LIMIAR_BRINDE
  const agoraMaiorOuIgual = atual >= LIMIAR_BRINDE
  const antesMaiorOuIgual = prev >= LIMIAR_BRINDE
  const agoraMenor = atual < LIMIAR_BRINDE

  // Travessia: < LIMIAR -> >= LIMIAR
  if (antesMenor && agoraMaiorOuIgual) {
    // NÃO redirecionar automaticamente.
    // Mostrar botão "Escolher meu brinde" (ou seja: garantir que não há brinde já adicionado)
    brindeLiberado.value = false
    // definimos o id alvo para quando o usuário clicar no botão
    brindeTargetId.value = 194

    // abrir sacola para o usuário ver necessidade de escolher o brinde
    abrirSacola()

    // Mensagem leve (opcional) para o usuário
    avisoExtra.value = 'Você atingiu o valor para escolher um brinde — abra a sacola e clique em "Escolher meu brinde".'
    setTimeout(() => {
      if (avisoExtra.value?.startsWith('Você atingiu o valor para escolher um brinde')) avisoExtra.value = ''
    }, 4500)

    return
  }

  // Travessia: >= LIMIAR -> < LIMIAR
  if (antesMaiorOuIgual && agoraMenor) {
    try {
      // Remove possíveis brindes (preço === 0) que não são permitidos após cair do limiar
      const temBrinde = sacola.itens.some((it: any) => Number(it.preco) === 0)
      if (temBrinde) {
        removerProdutosPrecoZero()
      }
    } catch (e) {
      console.warn('Falha ao tentar remover brindes após subtotal cair:', e)
    }

    // NÃO redirecionar automaticamente — apenas exibir o botão para que o usuário
    // opte por voltar à prateleira de brindes.
    brindeLiberado.value = false
    brindeTargetId.value = 191

    // Opcional: notificar usuário de forma breve
    avisoExtra.value = `Seu subtotal ficou abaixo de R$ ${LIMIAR_BRINDE.toFixed(2)}. Se desejar escolher outro brinde, abra a sacola.`
    setTimeout(() => {
      if (avisoExtra.value?.startsWith('Seu subtotal ficou abaixo')) avisoExtra.value = ''
    }, 4500)

    return
  }

  // para qualquer outro caso (sem travessia), não fazemos nada especial aqui
}




/* watchers adicionais para garantir regra do único brinde e transição do limiar (apenas total) */
watch(() => sacola.itens.map(i => ({ preco: Number(i.preco), quantidade: i.quantidadeSelecionada })), () => {
  // garantir apenas 1 produto gratis e quantidade = 1
  garantirUnicoBrindeEQuantidade()
}, { deep: true })
// WATCH TOTAL
watch(
  () => total.value,
  (novo) => {
    // checa apenas travessia do limiar; qualquer outra alteração que não cruze o LIMIAR
    // não deve disparar redirects automáticos.
    try {
      checarTransicaoLimiar(prevTotal.value, novo)
    } catch (err) {
      console.error('Erro em checarTransicaoLimiar:', err)
    }

    // atualizar prevTotal ao final
    prevTotal.value = novo
  }
)


/* ------------------- Função custom: removerProdutoCustom ------------------- */
/* substitui as chamadas diretas a sacola.removerProduto(index) para garantir
   que, se o cliente remover um brinde (preço === 0), a div "Escolhe meu brinde"
   volte a ficar disponível (brindeLiberado = false). */
function removerProdutoCustom(index: number, item: any) {
  try {
    // Se houver mais de uma unidade do item, apenas decrementamos a quantidade
    if (item && typeof item.quantidadeSelecionada === 'number' && item.quantidadeSelecionada > 1) {
      item.quantidadeSelecionada = Math.max(0, item.quantidadeSelecionada - 1)
    } else {
      // Caso contrário removemos o item da sacola (comportamento antigo)
      sacola.removerProduto(index)
    }
  } catch (err) {
    console.warn('Erro ao remover produto via removerProdutoCustom:', err)
  }

  // Se o item removido/alterado era um brinde (preço === 0), garantir que o botão fique disponível
  try {
    if (Number(item?.preco) === 0) {
      brindeLiberado.value = false
    }
  } catch (e) {
    console.warn('Erro ao verificar preço do item removido', e)
  }
}


// limpar campos nome entrega pagamento
function resetarFormulario() {
  clienteNome.value = ""
  opcaoEntrega.value = ""
  selecaoEntregaUI.value = ""
  opcaoPagamento.value = ""
  selecaoPagamentoUI.value = ""
  politicaChecked.value = false
  brindeLiberado.value = false
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

/* ---------- Estilos para selects "mais bonitos" (clean + moderno) ---------- */
.select-modern {
  width: 100%;
  padding-left: 0.5rem;
  padding-right: 2.25rem; /* espaço para seta */
  padding-top: 0.45rem;
  padding-bottom: 0.45rem;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(16,24,40,0.04);
  transition: box-shadow 150ms ease, border-color 150ms ease, transform 120ms ease;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  font-size: 0.875rem;
  line-height: 1rem;
  color: #111827;
}
.select-modern:focus {
  outline: none;
  box-shadow: 0 6px 18px rgba(213,106,160,0.08);
  border-color: rgba(213,106,160,0.6);
}
.select-modern[disabled] {
  background: #f8fafc;
  cursor: not-allowed;
  opacity: 0.9;
}

/* seta pequena à direita */
.select-arrow svg { color: #6b7280; width: 14px; height: 14px; }

/* Mantém comportamento responsivo já existente */
@media (min-width: 640px) {
  .policy-card { max-height: 34rem; }
}
</style>
