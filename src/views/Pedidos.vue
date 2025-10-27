<!-- src/views/Pedidos.vue (atualizado: primeiroNome no cabeçalho, Intl formatMoney, estilo futurista) -->
<template>
  <div class="p-6 max-w-6xl mx-auto page-root">
    <h1 class="page-title">Pedidos cadastrados</h1>

    <div class="controls">
      <button class="btn btn-ghost" @click="reload">Recarregar</button>
      <span v-if="loading" class="loading">Carregando...</span>
    </div>

    <div v-if="error" class="alert-error">Erro: {{ error }}</div>
    <div v-if="!loading && pedidos.length === 0" class="empty">Nenhum pedido encontrado.</div>

    <div class="grid gap-4">
      <article v-for="pedido in pedidos" :key="pedido.id" class="order-card">
        <header class="order-card__header">
          <div>
            <h2 class="order-card__title">
              Pedido #{{ pedido.id }}
              <span class="order-code" v-if="pedido.codigo_unico">{{ ' - ' + pedido.codigo_unico }}</span>
            </h2>
            <div class="customer-line" v-if="pedido.primeiroNome">
              Cliente: <strong>{{ formatPrimitive(pedido.primeiroNome) }}</strong>
            </div>
          </div>
          <div class="meta">
            Criado: <span class="meta-value">{{ formatPrimitive(pedido.createdAt) }}</span>
          </div>
        </header>

        <dl class="mt-3 space-y-2 details-list">
          <template v-for="key in displayKeys(pedido)" :key="key">
            <div class="detail-row">
              <dt class="detail-key">{{ key }}</dt>
              <dd class="detail-value">
                <!-- andamento -->
                <template v-if="key === 'andamento'">
                  <div v-if="editingAndamento[pedido.id]" class="edit-inline">
                    <select v-model="andamentoInputs[pedido.id]" class="select">
                      <option v-for="opt in andamentoOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                    </select>
                    <button class="btn btn-primary" :disabled="savingAndamento[pedido.id]" @click="saveAndamento(pedido)">
                      {{ savingAndamento[pedido.id] ? 'Salvando...' : 'Salvar' }}
                    </button>
                    <button class="btn" @click="cancelEditAndamento(pedido)">Cancelar</button>
                    <span class="msg">{{ messages[pedido.id] }}</span>
                  </div>

                  <div v-else class="view-inline">
                    <span class="value">{{ formatPrimitive(pedido.andamento) }}</span>
                    <button class="link" @click="startEditAndamento(pedido)">Editar</button>
                  </div>
                </template>

                <!-- entrega -->
                <template v-else-if="key === 'entrega'">
                  <div v-if="editingEntrega[pedido.id]" class="edit-inline">
                    <input type="text" v-model="entregaInputs[pedido.id]" class="input" placeholder="Informe entrega" />
                    <button class="btn btn-primary" :disabled="savingEntrega[pedido.id]" @click="saveEntrega(pedido)">
                      {{ savingEntrega[pedido.id] ? 'Salvando...' : 'Salvar' }}
                    </button>
                    <button class="btn" @click="cancelEditEntrega(pedido)">Cancelar</button>
                    <span class="msg">{{ messagesEntrega[pedido.id] }}</span>
                  </div>

                  <div v-else class="view-inline">
                    <span class="value">{{ formatPrimitive(pedido.entrega) }}</span>
                    <button class="link" @click="startEditEntrega(pedido)">Editar</button>
                  </div>
                </template>

                <!-- pagamento -->
                <template v-else-if="key === 'pagamento'">
                  <div v-if="editingPagamento[pedido.id]" class="edit-inline">
                    <select v-model="pagamentoInputs[pedido.id]" class="select">
                      <option v-for="opt in pagamentoOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                    </select>
                    <button class="btn btn-primary" :disabled="savingPagamento[pedido.id]" @click="savePagamento(pedido)">
                      {{ savingPagamento[pedido.id] ? 'Salvando...' : 'Salvar' }}
                    </button>
                    <button class="btn" @click="cancelEditPagamento(pedido)">Cancelar</button>
                    <span class="msg">{{ messagesPagamento[pedido.id] }}</span>
                  </div>

                  <div v-else class="view-inline">
                    <span class="value">{{ formatPrimitive(pedido.pagamento) }}</span>
                    <button class="link" @click="startEditPagamento(pedido)">Editar</button>
                  </div>
                </template>

                <!-- itens_sacola -->
                <template v-else-if="key === 'itens_sacola'">
                  <div class="items-block">
                    <div v-for="(item, idx) in pedido.itens_sacola" :key="idx" class="item-row">
                                                                  <img
                        v-if="item._imagemExibicao"
                        :src="item._imagemExibicao"
                        alt="foto"
                        class="item-thumb"
                      />
                      <div class="item-body">
                        <div class="item-title">
                          {{ item._produto?.title ?? item._produto?.nome ?? 'Produto desconhecido' }}
                          <small v-if="item._variante" class="item-variant"> — {{ item._variante.cor ?? item._variante.tamanho ?? item._variante.nome ?? ('Variante ' + (item._variante.ticket ?? item._variante.id ?? '')) }}</small>
                        </div>

                        <div class="item-meta">
                          <div class="meta-left">
                            Quantidade:
                            <template v-if="editingQuantidade[`${pedido.id}_${idx}`]">
                              <input type="number" min="0" v-model.number="quantidadeInputs[`${pedido.id}_${idx}`]" class="input-compact" />
                              <button class="btn btn-primary" :disabled="savingQuantidade[`${pedido.id}_${idx}`]" @click="saveQuantidade(pedido, idx, item)">
                                {{ savingQuantidade[`${pedido.id}_${idx}`] ? 'Salvando...' : 'Salvar' }}
                              </button>
                              <button class="btn" @click="cancelEditQuantidade(pedido, idx)">Cancelar</button>
                              <span class="msg">{{ messagesQuantidade[`${pedido.id}_${idx}`] }}</span>
                            </template>
                            <template v-else>
                              <strong>{{ item.quantidade }}</strong>
                              <button class="link" @click="startEditQuantidade(pedido, idx)">Editar</button>
                            </template>
                          </div>

                          <div class="meta-right">
                            Preço: <strong class="price">{{ formatMoney(item.preco) }}</strong>
                          </div>
                        </div>

                                                <div class="stock-line">
                          <!-- Estoque (mapa) ou a partir do objeto variante -->
                          <template v-if="getVariantStock(item) !== null">
                            Estoque variante: {{ getVariantStock(item) }}
                          </template>
                          <template v-else>
                            Estoque: <em>não disponível</em>
                          </template>

                          <!-- Campos adicionais da variante (cor, tamanho, aroma, etc.) -->
                          <template v-if="getVariantObj(item)">
                            <span v-if="getVariantObj(item).cor"> · Cor: {{ getVariantObj(item).cor }}</span>
                            <span v-if="getVariantObj(item).tamanho"> · Tamanho: {{ getVariantObj(item).tamanho }}</span>
                            <span v-if="getVariantObj(item).aroma"> · Aroma: {{ getVariantObj(item).aroma }}</span>

                            <!-- mostra automaticamente outros campos escalares presentes -->
                            <template v-for="(val, key) in extraVariantFields(getVariantObj(item))" :key="key">
                              <span v-if="val"> · {{ prettyLabel(key) }}: {{ val }}</span>
                            </template>
                          </template>
                        </div>

                      </div>
                    </div>
                  </div>
                </template>

                <!-- demais campos -->
                <template v-else>
                  <template v-if="isPrimitive(pedido[key])">
                    <span class="value">{{ formatPrimitive(pedido[key]) }}</span>
                  </template>
                  <template v-else>
                    <details class="details-json">
                      <summary class="cursor-pointer">Ver ({{ typeOf(pedido[key]) }})</summary>
                      <pre class="json">{{ prettyJSON(pedido[key]) }}</pre>
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


// --- Helpers para detectar chaves de totais (sem/com frete)
function detectTotalsKeys(pedido: any) {
  const semCandidates = ['sem_frete', 'semFrete', 'total_sem_frete', 'totalSemFrete', 'subtotal', 'subtotal_sem_frete'];
  const comCandidates = ['com_frete', 'comFrete', 'total_com_frete', 'totalComFrete', 'total_com', 'totalCom', 'total'];
  let semKey: string | null = null;
  let comKey: string | null = null;

  for (const k of semCandidates) {
    if (pedido && Object.prototype.hasOwnProperty.call(pedido, k)) { semKey = k; break; }
  }
  for (const k of comCandidates) {
    if (pedido && Object.prototype.hasOwnProperty.call(pedido, k)) { comKey = k; break; }
  }
  return { semKey, comKey };
}

/**
 * Atualiza apenas o campo de total que 'contém informação'.
 * - Considera que 'contém informação' = existe e é número diferente de 0.
 * - Se ambos contêm informação, empata para semKey (tie-breaker).
 * - Retorna um objeto com { chave: novoValor } pronto para enviar ao backend.
 */
function adjustPedidoTotals(pedido: any, unitPrice: number, deltaQuantidade: number) {
  const updates: Record<string, number> = {};
  if (!Number.isFinite(unitPrice) || deltaQuantidade === 0) return updates;

  const deltaValor = Number(unitPrice * deltaQuantidade);
  const { semKey, comKey } = detectTotalsKeys(pedido);

  const semVal = (semKey && Number.isFinite(Number(pedido[semKey]))) ? Number(pedido[semKey]) : NaN;
  const comVal = (comKey && Number.isFinite(Number(pedido[comKey]))) ? Number(pedido[comKey]) : NaN;

  const semHasInfo = Number.isFinite(semVal) && semVal !== 0;
  const comHasInfo = Number.isFinite(comVal) && comVal !== 0;

  // Decide qual chave atualizar (apenas 1)
  let toUpdateKey: string | null = null;
  if (semHasInfo && !comHasInfo) toUpdateKey = semKey;
  else if (!semHasInfo && comHasInfo) toUpdateKey = comKey;
  else if (semHasInfo && comHasInfo) {
    // Empate: preferimos semKey como tie-breaker. Ajuste aqui se preferir outro comportamento.
    toUpdateKey = semKey ?? comKey;
  } else {
    // nenhum dos campos contém informação -> não atualiza totals
    return updates;
  }

  if (!toUpdateKey) return updates;

  const current = Number.isFinite(Number(pedido[toUpdateKey])) ? Number(pedido[toUpdateKey]) : 0;
  const novoValor = Number((current + deltaValor).toFixed(2));
  pedido[toUpdateKey] = novoValor;
  updates[toUpdateKey] = novoValor;

  return updates;
}

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

/* Atualizado: usar Intl.NumberFormat para moeda BRL */
const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
function formatMoney(n: any) {
  const num = Number(n ?? 0);
  if (!Number.isFinite(num)) return currencyFormatter.format(0);
  return currencyFormatter.format(num);
}


// -------------------- helpers para variantes --------------------
function getVariantObj(item: any) {
  const prod = item._produto || item.produto || item.produtoResumo || {};
  const tryArrays = [
    prod.variantes,
    prod.rawProduct && prod.rawProduct.variantes,
    prod._produto && prod._produto.variantes
  ];
  const ticketStr = String(item.ticket ?? item.ticketPai ?? item.id ?? '');

  for (const arr of tryArrays) {
    if (Array.isArray(arr)) {
      const found = arr.find((v: any) => {
        return String(v.ticket ?? v.id ?? v._id) === ticketStr;
      });
      if (found) return found;
    }
  }
  return null;
}

function getVariantStock(item: any) {
  const prod = item._produto || item.produto || item.produtoResumo || {};
  const ticketStr = String(item.ticket ?? '');
  // 1) se existe um map (obj) de variantes com chave = ticket
  if (prod.variantes && !Array.isArray(prod.variantes) && (prod.variantes[ticketStr] !== undefined)) {
    return prod.variantes[ticketStr];
  }
  // 2) tenta achar a variante no array e ler estoqueVariante
  const v = getVariantObj(item);
  if (v && (v.estoqueVariante !== undefined && v.estoqueVariante !== null)) return v.estoqueVariante;
  // 3) checar nomes alternativos
  if (v) {
    if (v.stock !== undefined) return v.stock;
    if (v.estoque !== undefined) return v.estoque;
  }
  return null;
}

function extraVariantFields(variantObj: any) {
  if (!variantObj || typeof variantObj !== 'object') return {};
  // SKIP: campos que já mostramos explicitamente no template
  const skip = new Set([
    'id','ticket','estoqueVariante','stock','estoque',
    'createdAt','updatedAt',
    // campos mostrados explicitamente - evitar duplicação:
    'cor','tamanho','aroma'
  ]);
  const out: Record<string, any> = {};
  for (const k of Object.keys(variantObj)) {
    if (!skip.has(k) && (typeof variantObj[k] === 'string' || typeof variantObj[k] === 'number' || variantObj[k] === null)) {
      out[k] = variantObj[k];
    }
  }
  return out;
}


function prettyLabel(key: string) {
  const map: Record<string,string> = {
    cor: 'Cor',
    tamanho: 'Tamanho',
    aroma: 'Aroma',
    material: 'Material'
  };
  return map[key] || (key.charAt(0).toUpperCase() + key.slice(1));
}
// -------------------- fim helpers --------------------


/**
 * displayKeys: lista as chaves do pedido que devem aparecer no bloco de detalhes.
 * - remove explicitamente: codigo_unico, updatedAt, publishedAt, primeiroNome (essas não aparecem abaixo de itens_sacola)
 * - remove createdAt e id/documentId (já usados no header / meta)
 * - se existir chave 'sem_frete' ou 'com_frete' mas com valor 0 (ou não numérico), não as inclui
 */
function displayKeys(pedido: any): string[] {
  if (!pedido || typeof pedido !== 'object') return [];
  const preferOrder = ['andamento', 'pagamento', 'entrega', 'itens_sacola'];

  const keys = Object.keys(pedido || {});
  const exclude = new Set(['id', 'documentId', 'createdAt', 'codigo_unico', 'updatedAt', 'publishedAt', 'primeiroNome']);

  // detectar chaves possíveis de sem/com frete e verificar valores
  const { semKey, comKey } = detectTotalsKeys(pedido);
  const keysFiltered = keys.filter(k => !exclude.has(k));

  // se semKey existe mas valor é zero -> remover
  const out: string[] = [];
  for (const k of keysFiltered) {
    if (k === semKey) {
      const val = Number(pedido[k]);
      if (!Number.isFinite(val) || val === 0) continue; // pula sem_frete quando 0 ou inválido
    }
    if (k === comKey) {
      const val = Number(pedido[k]);
      if (!Number.isFinite(val) || val === 0) continue; // pula com_frete quando 0 ou inválido
    }
    out.push(k);
  }

  // montar ordenação: preferOrder primeiro, depois o restante na ordem original
  const ordered: string[] = [];
  for (const k of preferOrder) if (out.includes(k)) ordered.push(k);
  for (const k of out) {
    if (!ordered.includes(k)) ordered.push(k);
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

/* implementação de saveQuantidade (mantida sua lógica; integrado adjustPedidoTotals) */
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
    // Atualiza o estoque no Strapi
    await atualizarEstoqueSacola([payloadItem]);

    // Preparar itens atualizados localmente
    const idOrDoc = pedido.documentId ?? pedido.id;
    const newItens = JSON.parse(JSON.stringify(pedido.itens_sacola ?? []));
    newItens[idx].quantidade = novo;

    // Recalcular preco do item
    const antigoPreco = Number(item.preco ?? NaN);
    let unitPrice = 0;

    if (antigo > 0 && Number.isFinite(antigoPreco)) {
      unitPrice = antigoPreco / antigo;
    } else {
      const raw = (produto && produto.rawProduct) ? produto.rawProduct : produto;
      const priceKeys = [
        'preco', 'preco_unitario', 'precoUnitario', 'valor', 'valor_unitario',
        'valorUnitario', 'price', 'price_unit', 'priceUnit', 'price_value', 'amount'
      ];
      for (const k of priceKeys) {
        if (raw && raw[k] !== undefined && raw[k] !== null && !isNaN(Number(raw[k]))) {
          unitPrice = Number(raw[k]);
          break;
        }
      }
    }

    let novoPreco = 0;
    if (Number.isFinite(unitPrice) && unitPrice > 0 && Number.isFinite(novo)) {
      novoPreco = Number((unitPrice * novo).toFixed(2));
    } else {
      if (Number.isFinite(antigoPreco) && antigo > 0) {
        novoPreco = Number(((antigoPreco / antigo) * novo).toFixed(2));
      } else {
        novoPreco = 0;
      }
    }

    // Aplica novoPreco
    newItens[idx].preco = novoPreco;

    // recalcula os totais do pedido (apenas no campo que contém informação)
    const deltaQuantidade = Number(novo) - Number(antigo);
    const totalsUpdates = adjustPedidoTotals(pedido, unitPrice, deltaQuantidade);

    // sanitized items
    const sanitizedItensToSend = newItens.map((it: any) => {
      const copy: any = { ...it };
      delete copy._produto;
      delete copy.id;
      delete copy.documentId;
      return copy;
    });

    const payloadToSend: any = { itens_sacola: sanitizedItensToSend, ...totalsUpdates };

    // envia atualização para o Strapi
    await atualizarPedido(idOrDoc, payloadToSend);

    // atualiza dados locais
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

// ----------------- HELPERS (cole isto no topo do <script setup> ou antes da função load) -----------------
function safeGetFotos(produto: any) {
  if (!produto) return [];
  if (produto.fotos && Array.isArray(produto.fotos) && produto.fotos.length) return produto.fotos;
  if (produto.image && typeof produto.image === 'string') return [{ url: produto.image }];
  return [];
}

function escolherImagemProduto(produto: any, variante: any) {
  if (variante) {
    if (typeof variante.image === 'string' && variante.image.trim()) return variante.image;
    if (Array.isArray(variante.fotos) && variante.fotos.length) {
      return variante.fotos[0].url ?? variante.fotos[0].formats?.thumbnail?.url ?? null;
    }
  }
  const fotos = safeGetFotos(produto);
  if (fotos.length) return fotos[0].url ?? fotos[0].formats?.thumbnail?.url ?? fotos[0].url_full ?? null;
  if (produto && typeof produto.image === 'string') return produto.image;
  return null;
}

/**
 * Encontra a variante correspondente usando EXATAMENTE o campo `ticket` do item.
 * Retorna null se não encontrar. (Fallback: se o produto tiver apenas 1 variante, retorna ela.)
 */
// substitua a função antiga por esta versão mais robusta
function findVariantByTicket(item: any, produto: any) {
  if (!produto || !Array.isArray(produto.variantes) || produto.variantes.length === 0) return null;

  // 1) campos prioritários onde esperamos o ticket da variante
  const primaryFields = ['ticket', 'ticketVariante', 'ticket_variante', 'ticket_var', 'varianteTicket', 'ticket_id'];

  for (const field of primaryFields) {
    if (item[field] !== undefined && item[field] !== null && String(item[field]) !== '') {
      const val = String(item[field]);
      const found = produto.variantes.find((v: any) => String(v.ticket) === val || String(v.id) === val);
      if (found) return found;
    }
  }

  // 2) outros nomes possíveis (compatibilidade)
  if (item.variante_id || item.variante_id === 0) {
    const val = String(item.variante_id);
    const found = produto.variantes.find((v: any) => String(v.ticket) === val || String(v.id) === val);
    if (found) return found;
  }

  // 3) varredura dos valores escalares do item: procura qualquer valor que case com ticket/id da variante
  //    (útil quando o campo foi salvo com um nome inesperado)
  try {
    const scalarValues = new Set<string>();
    for (const k of Object.keys(item)) {
      const v = item[k];
      if (v === null || v === undefined) continue;
      // só considere primitivos simples
      if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') {
        scalarValues.add(String(v));
      }
    }
    if (scalarValues.size > 0) {
      for (const variant of produto.variantes) {
        const vt = String(variant.ticket ?? variant.id ?? '');
        if (scalarValues.has(vt)) return variant;
        // também verifique id em string
        if (variant.id !== undefined && scalarValues.has(String(variant.id))) return variant;
      }
    }
  } catch (err) {
    // não falhar: se objeto reativo dá problema ao iterar, ignoramos aqui e seguimos
    console.debug('findVariantByTicket: varredura fallback falhou', err);
  }

  // 4) fallback opcional: se só houver 1 variante, retorne ela (se preferir, remova este fallback)
  if (produto.variantes.length === 1) return produto.variantes[0];

  return null;
}


// ----------------- FUNÇÃO load() (substitua a sua existente por esta) -----------------
async function load() {
  loading.value = true;
  error.value = null;
  try {
    const all = await getAllPedidosAllPages('*', 100);
    pedidos.value = all || [];

    // coletar ticketPai únicos
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

      // log geral para inspeção
      console.log('🧩 produtosMap retornado:', produtosMap);

      const notFoundTickets: string[] = [];

      // enrich dos itens: produto, variante (por ticket) e imagem pronta
      for (const pedido of pedidos.value) {
        const itens = Array.isArray(pedido.itens_sacola) ? pedido.itens_sacola : [];
        for (const it of itens) {
          const tp = String(it?.ticketPai ?? it?.ticket_pai ?? '');
          const produto = produtosMap?.[tp] ?? null;
          it._produto = produto;

          if (!produto) {
            notFoundTickets.push(tp);
            it._variante = null;
            it._imagemExibicao = null;
            continue;
          }



          // debug: imprimir os campos primitivos do item para ver onde o ticket da variante foi salvo
const itemScalars: Record<string,string> = {};
for (const k of Object.keys(it)) {
  const v = it[k];
  if (v === null || v === undefined) continue;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') itemScalars[k] = String(v);
}
console.log('🔎 campos escalares do item (para corresponder variante):', itemScalars);




          // encontra a variante usando o campo `ticket` do item
          const variante = findVariantByTicket(it, produto);
          it._variante = variante;

          // imagem pronta para exibição (prioriza variante)
          it._imagemExibicao = escolherImagemProduto(produto, variante);

          // log detalhado por item (útil para debugging)
          console.log('📦 item resolvido =>', {
            ticketPai: tp,
            itemOriginal: it,
            produtoResumo: produto ? { id: produto.id ?? produto.documentId ?? null, title: produto.title ?? produto.nome } : null,
            varianteResumo: variante ? { id: variante.id ?? null, ticket: variante.ticket ?? null, estoqueVariante: variante.estoqueVariante ?? null } : null,
            imagem: it._imagemExibicao
          });
        }
      }

      if (notFoundTickets.length > 0) {
        // remove duplicados e loga
        const uniq = Array.from(new Set(notFoundTickets));
        console.warn('Tickets sem produto retornado (verificar consulta):', uniq);
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
/* Futurista / clean design: glass + neon accents, mantendo legibilidade */

/* page */
.page-root {
  background: linear-gradient(180deg, #07070a 0%, #0b0d12 60%);
  min-height: 100vh;
  color: #e6eef6;
  padding-bottom: 60px;
}
.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #dff7ff;
  margin-bottom: 14px;
  text-shadow: 0 6px 20px rgba(13, 121, 121, 0.08);
}

/* controls */
.controls {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 18px;
}
.btn {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  color: #e6eef6;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: transform .12s ease, box-shadow .12s ease;
  font-size: 0.95rem;
}
.btn:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(6, 182, 212, 0.06); }
.btn-primary {
  background: linear-gradient(90deg, #00d4ff, #5df3c1);
  color: #052027;
  border: none;
  box-shadow: 0 6px 30px rgba(45, 230, 200, 0.12);
}
.btn-ghost {
  background: transparent;
  border: 1px dashed rgba(255,255,255,0.06);
}
.link {
  background: none;
  border: none;
  color: #7cf0e0;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.9rem;
}

/* small helpers */
.loading { color: #9adbd6; }
.alert-error { color: #ffb3b3; margin-bottom: 12px; }
.empty { color: #98b0b0; }

/* order card */
.order-card {
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
  border: 1px solid rgba(120, 240, 230, 0.06);
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 12px 40px rgba(3,7,12,0.55);
  backdrop-filter: blur(6px);
  overflow: hidden;
}

/* header */
.order-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
}
.order-card__title {
  font-weight: 700;
  color: #dff7ff;
  margin: 0 0 6px 0;
  font-size: 1rem;
}
.order-code {
  color: rgba(124, 240, 224, 0.95);
  font-weight: 600;
  margin-left: 8px;
}
.customer-line {
  color: #aee9e1;
  font-size: 0.9rem;
}
.meta { color: #9adbd6; font-size: 0.85rem; }

/* details */
.details-list {
  display: block;
}
.detail-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 10px;
  border-radius: 10px;
  transition: background .12s ease;
}
.detail-row:hover {
  background: linear-gradient(90deg, rgba(12,20,25,0.25), rgba(10,14,18,0.12));
}
.detail-key {
  width: 12rem;
  color: rgba(168, 231, 219, 0.9);
  font-weight: 600;
  font-size: 0.95rem;
}
.detail-value { flex: 1; color: #cfeff0; }

/* items block */
.items-block { display: flex; flex-direction: column; gap: 12px; }
.item-row {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.008));
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.03);
}
.item-thumb {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid rgba(124,240,224,0.06);
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.04);
}
.item-body { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.item-title { font-weight: 700; color: #e6fbf6; }
.item-meta { display: flex; justify-content: space-between; align-items: center; gap: 12px; color: #bfeee7; font-size: 0.95rem; }
.meta-left { display:flex; align-items:center; gap:8px; }
.meta-right { color: #dff7ff; font-weight:700; }
.price { color: #7cf0e0; }

/* stock */
.stock-line { font-size: 0.85rem; color: #9adbd6; }

/* inputs */
.input, .select {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  padding: 6px 10px;
  border-radius: 8px;
  color: #e6fbf6;
}
.input-compact {
  width: 84px;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.04);
  background: rgba(255,255,255,0.02);
  color: #e6fbf6;
}

/* messages */
.msg { color: #9df1e0; margin-left: 8px; font-size: 0.9rem; }

/* JSON details */
.details-json summary { color: #7cf0e0; cursor: pointer; }
.json { background: rgba(255,255,255,0.02); padding: 10px; border-radius: 8px; color: #bfeee7; font-size: 0.9rem; }

/* responsive tweaks */
@media (max-width: 900px) {
  .detail-key { width: 8rem; font-size: 0.9rem; }
  .item-thumb { width: 64px; height: 64px; }
}
</style>
