<!-- src/views/Pedidos.vue (corrigido: sanitização antes de enviar ao Strapi) -->
<template>
  <div class="p-6 max-w-6xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">Pedidos cadastrados</h1>

    <div class="mb-4 flex items-center gap-4">
      <button class="px-3 py-1 border rounded" @click="reload">Recarregar</button>
      <span v-if="loading" class="text-gray-600">Carregando...</span>
    </div>

    <div v-if="error" class="text-red-600 mb-4">Erro: {{ error }}</div>
    <div v-if="!loading && pedidos.length === 0" class="text-gray-700">Nenhum pedido encontrado.</div>

    <div class="grid gap-4">
      <article v-for="pedido in pedidos" :key="pedido.id" class="border rounded p-4 bg-white shadow-sm relative overflow-hidden">
        <header class="flex justify-between items-baseline">
          <div>
            <h2 class="font-semibold">Pedido #{{ pedido.id }} <span class="text-sm text-gray-500">{{ pedido.codigo_unico ? (' - ' + pedido.codigo_unico) : '' }}</span></h2>
            <div class="text-sm text-gray-600">{{ formatPrimitive(pedido.primeiroNome) }}</div>
          </div>
          <div class="text-sm text-gray-500">Criado: {{ formatPrimitive(pedido.createdAt) }}</div>
        </header>

        <dl class="mt-3 space-y-2">
          <template v-for="key in displayKeys(pedido)" :key="key">
            <div class="flex gap-4 items-start">
              <dt class="w-44 font-medium text-gray-700">{{ key }}</dt>
              <dd class="flex-1">
                <!-- andamento -->
                <template v-if="key === 'andamento'">
                  <div v-if="editingAndamento[pedido.id]" class="flex items-center gap-2">
                    <select v-model="andamentoInputs[pedido.id]" class="border px-2 py-1 rounded">
                      <option v-for="opt in andamentoOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                    </select>
                    <button class="px-2 py-1 border rounded" :disabled="savingAndamento[pedido.id]" @click="saveAndamento(pedido)">
                      {{ savingAndamento[pedido.id] ? 'Salvando...' : 'Salvar' }}
                    </button>
                    <button class="px-2 py-1 border rounded" @click="cancelEditAndamento(pedido)">Cancelar</button>
                    <span class="text-sm text-green-600 ml-2">{{ messages[pedido.id] }}</span>
                  </div>

                  <div v-else class="flex items-center gap-3">
                    <span class="text-sm text-gray-800">{{ formatPrimitive(pedido.andamento) }}</span>
                    <button class="text-sm text-blue-600 underline" @click="startEditAndamento(pedido)">Editar</button>
                  </div>
                </template>

                <!-- entrega -->
                <template v-else-if="key === 'entrega'">
                  <div v-if="editingEntrega[pedido.id]" class="flex items-center gap-2">
                    <input type="text" v-model="entregaInputs[pedido.id]" class="border px-2 py-1 rounded" placeholder="Informe entrega" />
                    <button class="px-2 py-1 border rounded" :disabled="savingEntrega[pedido.id]" @click="saveEntrega(pedido)">
                      {{ savingEntrega[pedido.id] ? 'Salvando...' : 'Salvar' }}
                    </button>
                    <button class="px-2 py-1 border rounded" @click="cancelEditEntrega(pedido)">Cancelar</button>
                    <span class="text-sm text-green-600 ml-2">{{ messagesEntrega[pedido.id] }}</span>
                  </div>

                  <div v-else class="flex items-center gap-3">
                    <span class="text-sm text-gray-800">{{ formatPrimitive(pedido.entrega) }}</span>
                    <button class="text-sm text-blue-600 underline" @click="startEditEntrega(pedido)">Editar</button>
                  </div>
                </template>

                <!-- pagamento -->
                <template v-else-if="key === 'pagamento'">
                  <div v-if="editingPagamento[pedido.id]" class="flex items-center gap-2">
                    <select v-model="pagamentoInputs[pedido.id]" class="border px-2 py-1 rounded">
                      <option v-for="opt in pagamentoOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                    </select>
                    <button class="px-2 py-1 border rounded" :disabled="savingPagamento[pedido.id]" @click="savePagamento(pedido)">
                      {{ savingPagamento[pedido.id] ? 'Salvando...' : 'Salvar' }}
                    </button>
                    <button class="px-2 py-1 border rounded" @click="cancelEditPagamento(pedido)">Cancelar</button>
                    <span class="text-sm text-green-600 ml-2">{{ messagesPagamento[pedido.id] }}</span>
                  </div>

                  <div v-else class="flex items-center gap-3">
                    <span class="text-sm text-gray-800">{{ formatPrimitive(pedido.pagamento) }}</span>
                    <button class="text-sm text-blue-600 underline" @click="startEditPagamento(pedido)">Editar</button>
                  </div>
                </template>

                <!-- itens_sacola -->
                <template v-else-if="key === 'itens_sacola'">
                  <div class="space-y-4">
                    <div v-for="(item, idx) in pedido.itens_sacola" :key="idx" class="flex gap-4 items-start">
                      <img
                        v-if="item._produto?.image"
                        :src="item._produto.image"
                        alt="foto"
                        class="w-20 h-20 object-cover rounded border"
                      />
                      <div class="flex-1">
                        <div class="font-medium">
                          {{ item._produto?.title || 'Produto desconhecido' }}
                        </div>
                        <div class="text-sm text-gray-600">
                          Quantidade:
                          <template v-if="editingQuantidade[`${pedido.id}_${idx}`]">
                            <input type="number" min="0" v-model.number="quantidadeInputs[`${pedido.id}_${idx}`]" class="border px-2 py-1 rounded w-20" />
                            <button class="px-2 py-1 border rounded ml-2" :disabled="savingQuantidade[`${pedido.id}_${idx}`]" @click="saveQuantidade(pedido, idx, item)">
                              {{ savingQuantidade[`${pedido.id}_${idx}`] ? 'Salvando...' : 'Salvar' }}
                            </button>
                            <button class="px-2 py-1 border rounded ml-1" @click="cancelEditQuantidade(pedido, idx)">Cancelar</button>
                            <span class="text-sm text-green-600 ml-2">{{ messagesQuantidade[`${pedido.id}_${idx}`] }}</span>
                          </template>
                          <template v-else>
                            <strong>{{ item.quantidade }}</strong>
                            <button class="text-sm text-blue-600 underline ml-2" @click="startEditQuantidade(pedido, idx)">Editar</button>
                          </template>
                          &nbsp; — &nbsp;
                          Preço: <strong>R$ {{ formatMoney(item.preco) }}</strong>
                        </div>

                        <div class="text-sm text-gray-600 mt-1">
                          <template v-if="item._produto?.estoqueUnico !== null && item._produto?.estoqueUnico !== undefined">
                            Estoque único: {{ item._produto.estoqueUnico }}
                          </template>
                          <template v-else-if="item.ticket !== null && item._produto?.variantes[String(item.ticket)] !== undefined">
                            Estoque variante: {{ item._produto.variantes[String(item.ticket)] }}
                          </template>
                          <template v-else>
                            Estoque: <em>não disponível</em>
                          </template>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- demais campos -->
                <template v-else>
                  <template v-if="isPrimitive(pedido[key])">
                    <span>{{ formatPrimitive(pedido[key]) }}</span>
                  </template>
                  <template v-else>
                    <details>
                      <summary class="cursor-pointer text-sm text-blue-600">Ver ({{ typeOf(pedido[key]) }})</summary>
                      <pre class="whitespace-pre-wrap mt-2 bg-gray-50 rounded text-sm overflow-auto">{{ prettyJSON(pedido[key]) }}</pre>
                    </details>
                  </template>
                </template>
              </dd>
            </div>
          </template>
        </dl>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  getAllPedidosAllPages,
  getProdutosPorTicketPaises,
  atualizarAndamentoPedido,
  atualizarEntregaPedido,
  atualizarPagamentoPedido,
  atualizarPedido,
  atualizarEstoqueSacola
} from '@/services/strapi';

const pedidos = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

/* edição andamento */
const editingAndamento = reactive<Record<number, boolean>>({});
const andamentoInputs = reactive<Record<number, string>>({});
const savingAndamento = reactive<Record<number, boolean>>({});
const messages = reactive<Record<number, string | null>>({});

/* entrega */
const editingEntrega = reactive<Record<number, boolean>>({});
const entregaInputs = reactive<Record<number, string>>({});
const savingEntrega = reactive<Record<number, boolean>>({});
const messagesEntrega = reactive<Record<number, string | null>>({});

/* pagamento */
const editingPagamento = reactive<Record<number, boolean>>({});
const pagamentoInputs = reactive<Record<number, string>>({});
const savingPagamento = reactive<Record<number, boolean>>({});
const messagesPagamento = reactive<Record<number, string | null>>({});

const andamentoOptions = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'entregue', label: 'Entregue' },
];

const pagamentoOptions = [
  { value: 'Pix', label: 'Pix' },
  { value: 'Link de pagamento', label: 'Link de pagamento' },
  { value: 'Dinheiro Vivo', label: 'Dinheiro Vivo' },
  { value: 'Cartão de Crédito', label: 'Cartão de Crédito' },
];

/* utilitários */
function isPrimitive(v: any) {
  return v === null || (typeof v !== 'object' && typeof v !== 'function');
}
function formatPrimitive(v: any) {
  if (v === null || v === undefined) return '-';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  return String(v);
}
function prettyJSON(v: any) {
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}
function typeOf(v: any) { return v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v; }
function formatMoney(n: any) {
  const num = Number(n ?? 0);
  return isNaN(num) ? '0,00' : num.toFixed(2).replace('.', ',');
}

function displayKeys(pedido: any): string[] {
  if (!pedido || typeof pedido !== 'object') return [];
  const preferOrder = ['andamento', 'pagamento', 'entrega', 'itens_sacola'];
  const keys = Object.keys(pedido || {});
  const exclude = new Set(['id', 'documentId', 'createdAt']);
  const ordered: string[] = [];
  for (const k of preferOrder) if (keys.includes(k)) ordered.push(k);
  for (const k of keys) {
    if (!ordered.includes(k) && !exclude.has(k)) ordered.push(k);
  }
  return ordered;
}

/* edição andamento */
function startEditAndamento(p: any) {
  editingAndamento[p.id] = true;
  andamentoInputs[p.id] = p.andamento ?? '';
  messages[p.id] = null;
}
function cancelEditAndamento(p: any) {
  editingAndamento[p.id] = false;
  andamentoInputs[p.id] = '';
  messages[p.id] = null;
}
async function saveAndamento(pedido: any) {
  const idOrDoc = pedido.documentId ?? pedido.id;
  const id = pedido.id;
  const novo = andamentoInputs[id];
  if (!novo) {
    messages[id] = 'Selecione uma opção';
    return;
  }
  savingAndamento[id] = true;
  messages[id] = null;
  try {
    await atualizarAndamentoPedido(idOrDoc, novo);
    pedido.andamento = novo;
    messages[id] = 'Salvo';
    editingAndamento[id] = false;
    setTimeout(() => { messages[id] = null; }, 2500);
  } catch (err: any) {
    console.error('Erro ao salvar andamento', err);
    messages[id] = `Erro: ${err?.message ?? String(err)}`;
  } finally {
    savingAndamento[id] = false;
  }
}

/* entrega */
function startEditEntrega(p: any) {
  editingEntrega[p.id] = true;
  entregaInputs[p.id] = p.entrega ?? '';
  messagesEntrega[p.id] = null;
}
function cancelEditEntrega(p: any) {
  editingEntrega[p.id] = false;
  entregaInputs[p.id] = '';
  messagesEntrega[p.id] = null;
}
async function saveEntrega(pedido: any) {
  const idOrDoc = pedido.documentId ?? pedido.id;
  const id = pedido.id;
  const novo = (entregaInputs[id] ?? '').toString().trim();
  if (!novo) {
    messagesEntrega[id] = 'Informe a entrega';
    return;
  }
  savingEntrega[id] = true;
  messagesEntrega[id] = null;
  try {
    await atualizarEntregaPedido(idOrDoc, novo);
    pedido.entrega = novo;
    messagesEntrega[id] = 'Salvo';
    editingEntrega[id] = false;
    setTimeout(() => { messagesEntrega[id] = null; }, 2500);
  } catch (err: any) {
    console.error('Erro ao salvar entrega', err);
    messagesEntrega[id] = `Erro: ${err?.message ?? String(err)}`;
  } finally {
    savingEntrega[id] = false;
  }
}

/* pagamento */
function startEditPagamento(p: any) {
  editingPagamento[p.id] = true;
  pagamentoInputs[p.id] = p.pagamento ?? '';
  messagesPagamento[p.id] = null;
}
function cancelEditPagamento(p: any) {
  editingPagamento[p.id] = false;
  pagamentoInputs[p.id] = '';
  messagesPagamento[p.id] = null;
}
async function savePagamento(pedido: any) {
  const idOrDoc = pedido.documentId ?? pedido.id;
  const id = pedido.id;
  const novo = pagamentoInputs[id];
  if (!novo) {
    messagesPagamento[id] = 'Selecione uma opção';
    return;
  }
  savingPagamento[id] = true;
  messagesPagamento[id] = null;
  try {
    await atualizarPagamentoPedido(idOrDoc, novo);
    pedido.pagamento = novo;
    messagesPagamento[id] = 'Salvo';
    editingPagamento[id] = false;
    setTimeout(() => { messagesPagamento[id] = null; }, 2500);
  } catch (err: any) {
    console.error('Erro ao salvar pagamento', err);
    messagesPagamento[id] = `Erro: ${err?.message ?? String(err)}`;
  } finally {
    savingPagamento[id] = false;
  }
}

/* edição quantidade */
const editingQuantidade = reactive<Record<string, boolean>>({});
const quantidadeInputs = reactive<Record<string, number>>({});
const savingQuantidade = reactive<Record<string, boolean>>({});
const messagesQuantidade = reactive<Record<string | number, string | null>>({});

function keyForQuantidade(pedidoId: number | string, idx: number) {
  return `${String(pedidoId)}_${String(idx)}`;
}

function startEditQuantidade(pedido: any, idx: number) {
  const key = keyForQuantidade(pedido.id, idx);
  editingQuantidade[key] = true;
  const item = (Array.isArray(pedido.itens_sacola) ? pedido.itens_sacola[idx] : null) ?? null;
  quantidadeInputs[key] = Number(item?.quantidade ?? 0);
  messagesQuantidade[key] = null;
}

function cancelEditQuantidade(pedido: any, idx: number) {
  const key = keyForQuantidade(pedido.id, idx);
  editingQuantidade[key] = false;
  quantidadeInputs[key] = undefined as any;
  messagesQuantidade[key] = null;
}

async function saveQuantidade(pedido: any, idx: number, item: any) {
  const key = keyForQuantidade(pedido.id, idx);
  const novo = Number(quantidadeInputs[key]);
  if (!Number.isFinite(novo)) {
    messagesQuantidade[key] = 'Quantidade inválida';
    return;
  }
  const antigo = Number(item.quantidade ?? 0);
  const delta = novo - antigo;
  if (delta === 0) {
    editingQuantidade[key] = false;
    messagesQuantidade[key] = 'Sem alterações';
    setTimeout(() => { messagesQuantidade[key] = null; }, 2000);
    return;
  }

  const produto = item._produto ?? null;
  if (!produto) {
    messagesQuantidade[key] = 'Produto sem informações de estoque';
    return;
  }

  let currentStock: number | null = null;
  let isUniqueStock = false;
  if (produto.estoqueUnico !== null && produto.estoqueUnico !== undefined) {
    currentStock = Number(produto.estoqueUnico ?? 0);
    isUniqueStock = true;
  } else {
    const ticketKey = String(item.ticket ?? '');
    if (produto.variantes && Object.prototype.hasOwnProperty.call(produto.variantes, ticketKey)) {
      currentStock = Number(produto.variantes[ticketKey] ?? 0);
      isUniqueStock = false;
    }
  }

  if (currentStock === null || !Number.isFinite(currentStock)) {
    messagesQuantidade[key] = 'Estoque do produto não disponível';
    return;
  }

  const newStock = currentStock - delta;
  if (newStock < 0) {
    messagesQuantidade[key] = 'Estoque insuficiente para essa alteração';
    return;
  }

  // preparar payload para atualizarEstoqueSacola
  const payloadItem: any = {
    ticketPai: Number(item.ticketPai ?? item.ticket_pai ?? 0),
    quantidade: Number(newStock),
  };
  if (item.ticket !== null && item.ticket !== undefined) {
    payloadItem.ticket = Number(item.ticket);
  }

  savingQuantidade[key] = true;
  messagesQuantidade[key] = null;

  try {
    // 1) atualizar estoque no Strapi (envia novo valor de estoque)
    await atualizarEstoqueSacola([payloadItem]);

    // 2) atualizar o pedido (itens_sacola) no Strapi - sanitizando antes de enviar
    const idOrDoc = pedido.documentId ?? pedido.id;
    const newItens = JSON.parse(JSON.stringify(pedido.itens_sacola ?? []));
    newItens[idx].quantidade = novo;

    // criar cópia sanitizada que NÃO inclui campos transitórios como _produto ou ids
    const sanitizedItensToSend = newItens.map((it: any) => {
      const copy: any = { ...it };
      delete copy._produto;
      delete copy.id;
      delete copy.documentId;
      return copy;
    });

    await atualizarPedido(idOrDoc, { itens_sacola: sanitizedItensToSend });

    // 3) atualizar dados locais para refletir as mudanças (mantendo _produto localmente)
    pedido.itens_sacola = newItens;

    if (isUniqueStock) {
      if (item._produto) item._produto.estoqueUnico = Number(newStock);
      if (pedido.itens_sacola[idx]?._produto) pedido.itens_sacola[idx]._produto.estoqueUnico = Number(newStock);
    } else {
      const tk = String(item.ticket ?? '');
      if (item._produto) {
        if (!item._produto.variantes) item._produto.variantes = {};
        item._produto.variantes[tk] = Number(newStock);
      }
      if (pedido.itens_sacola[idx]?._produto) {
        if (!pedido.itens_sacola[idx]._produto.variantes) pedido.itens_sacola[idx]._produto.variantes = {};
        pedido.itens_sacola[idx]._produto.variantes[tk] = Number(newStock);
      }
    }

    messagesQuantidade[key] = 'Salvo';
    editingQuantidade[key] = false;
    setTimeout(() => { messagesQuantidade[key] = null; }, 2500);
  } catch (err: any) {
    console.error('Erro ao salvar quantidade', err);
    messagesQuantidade[key] = `Erro: ${err?.message ?? String(err)}`;
  } finally {
    savingQuantidade[key] = false;
  }
}

/* carregamento + enrich */
async function load() {
  loading.value = true;
  error.value = null;
  try {
    const all = await getAllPedidosAllPages('*', 100);
    pedidos.value = all || [];

    const set = new Set<string>();
    for (const pedido of pedidos.value) {
      const itens = Array.isArray(pedido.itens_sacola) ? pedido.itens_sacola : [];
      for (const it of itens) {
        const tp = it?.ticketPai ?? it?.ticket_pai ?? null;
        if (tp !== null && tp !== undefined) set.add(String(tp));
      }
    }

    const ticketPais = Array.from(set);
    if (ticketPais.length > 0) {
      const produtosMap = await getProdutosPorTicketPaises(ticketPais);
      for (const pedido of pedidos.value) {
        const itens = Array.isArray(pedido.itens_sacola) ? pedido.itens_sacola : [];
        for (const it of itens) {
          const tp = String(it?.ticketPai ?? it?.ticket_pai ?? '');
          it._produto = produtosMap[tp] ?? null;
        }
      }
    }
  } catch (err: any) {
    console.error(err);
    error.value = err?.message ?? String(err);
  } finally {
    loading.value = false;
  }
}
function reload() { load(); }

onMounted(() => { load(); });
</script>

<style scoped>
/* tailwind classes já cuidam da maior parte */
</style>
