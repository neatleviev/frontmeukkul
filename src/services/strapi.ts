// src/services/strapi.ts

const STRAPI_API_URL = import.meta.env.VITE_STRAPI_API_URL
const ADMIN_TOKEN = import.meta.env.VITE_STRAPI_ADMIN_TOKEN

/* ============================================================
 * ESTOQUE
 * ============================================================ */
export async function atualizarEstoqueSacola(payload: {
  ticketPai: number
  ticket?: number
  quantidade: number
}[]) {
  try {
    console.log("Payload enviado:", payload)

    const response = await fetch(`${STRAPI_API_URL}/produtos/atualizar-estoque`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify(payload),
    })

    const json = await response.json()
    console.log("Resposta Strapi:", response.status, json)

    if (!response.ok) {
      throw new Error(`Erro ao atualizar estoque: ${response.status}`)
    }

    return json
  } catch (err) {
    console.error('Erro na atualização de estoque:', err)
    throw err
  }
}




/* ============================================================
 * BUSCAR PRODUTO POR TICKETPAI (usando documentId no v5)
 * ============================================================ */
export async function buscarProdutoPorTicketPai(ticketPai: number) {
  const res = await fetch(
     `${STRAPI_API_URL}/produtos?filters[ticketPai][$eq]=${ticketPai}&populate=*`,
    {
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
    }
  )
  if (!res.ok) {
    throw new Error(`Erro ao buscar produto: ${res.status}`)
  }
  const json = await res.json()
  return json.data[0] // retorna objeto que contém documentId
}





/* ============================================================
 * MAPEAMENTO DAS ENUMS (FRONT -> STRAPI) tornando editavel campos selects entrega e pagamento
 * ============================================================ */
export function mapEntregaToEnum(
  codeOrText: string
): "Vou retirar no Meukkul" | "Uber entrega no Meukkul" | "Entrega no Meukkul por (RS: 4,00)" {
  const val = (codeOrText || '').trim()
  if (val === 'retirada' || val === 'Vou retirar no Meukkul') return 'Vou retirar no Meukkul'
  if (val === 'uber' || val === 'Uber entrega no Meukkul') return 'Uber entrega no Meukkul'
  if (val === 'meukkul' || val === 'Entrega no Meukkul por (RS: 4,00)') return 'Entrega no Meukkul por (RS: 4,00)'
  return 'Entrega no Meukkul por (RS: 4,00)'
}

export function mapPagamentoToEnum(
  codeOrText: string
): "Pix" | "Link de pagamento" | "Dinheiro Vivo" | "Cartão de Crédito" {
  const val = (codeOrText || '').trim()
  if (val === 'pix' || val === 'Pix') return 'Pix'
  if (val === 'link' || val === 'Link de pagamento') return 'Link de pagamento'
  if (val === 'dinheiro' || val === 'Dinheiro Vivo') return 'Dinheiro Vivo'
  if (val === 'credito' || val === 'Cartão de Crédito') return 'Cartão de Crédito'
  return 'Pix'
}

/* ============================================================
 * GERAÇÃO DE CÓDIGO ÚNICO
 * ============================================================ */
function gerarCodigoUnico(): string {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  const ts = Date.now()
  return `PED-${ts}-${rand}`
}

/* ============================================================
 * CRIAR PEDIDO NO STRAPI v5
 * ============================================================ */
type ItemPedidoPayload = {
  quantidade: number
  preco: number
  ticketPai: number
  ticket?: number
}

type PedidoPayload = {
  primeiroNome: string
  codigo_unico?: string
  andamento?: 'pendente' | 'confirmado' | 'cancelado' | 'entregue'
  comFrete?: number
  semFrete?: number
  entrega: "Vou retirar no Meukkul" | "Uber entrega no Meukkul" | "Entrega no Meukkul por (RS: 4,00)"
  pagamento: "Pix" | "Link de pagamento" | "Dinheiro Vivo" | "Cartão de Crédito"
  itens_sacola: ItemPedidoPayload[]
}

export async function criarPedidoStrapi(pedido: PedidoPayload) {
  // Ajustar relação produto -> Strapi v5
  const itensFormatados = pedido.itens_sacola.map((item) => ({
    quantidade: item.quantidade,
    preco: item.preco,
    ticketPai: item.ticketPai,
    ticket: item.ticket ?? null,
  }))

  // Payload principal
  const data: any = {
    codigo_unico: pedido.codigo_unico || gerarCodigoUnico(),
    primeiroNome: pedido.primeiroNome,
    andamento: pedido.andamento || 'pendente',
    entrega: pedido.entrega,
    pagamento: pedido.pagamento,
    itens_sacola: itensFormatados,
  }

  // envia só um dos dois valores (comFrete ou semFrete)
  if (pedido.comFrete !== undefined) {
    data.comFrete = pedido.comFrete
  } else if (pedido.semFrete !== undefined) {
    data.semFrete = pedido.semFrete
  }

  const url = `${STRAPI_API_URL}/pedidos`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_TOKEN}`,
    },
    body: JSON.stringify({ data }),
  })

  let json: any = null
  try {
    json = await res.json()
  } catch (_e) {}

  if (!res.ok) {
    console.error('[strapi] criarPedido erro', res.status, json)
    throw new Error(`Erro ao criar pedido: ${res.status} — ${JSON.stringify(json)}`)
  }

  console.log('[strapi] criarPedido OK:', json)
  return json
}



/* ============================================================
 * BUSCAR TODOS OS PEDIDOS (paginação + populate)
 * ============================================================ */
type StrapiRaw = any;

function normalizeStrapiList(raw: StrapiRaw) {
  if (!raw) return [];
  // Caso já seja array "flat"
  if (Array.isArray(raw)) return raw;

  // Formato comum v4/v5: raw.data = [...]
  if (Array.isArray(raw.data)) {
    return raw.data.map((item: any) => {
      // v4: item.attributes
      if (item.attributes) {
        return { id: item.id, ...item.attributes };
      }
      // v5: item pode já vir com campos no primeiro nível
      // Ex.: { id, primeiroNome, itens_sacola: [...] }
      return item;
    });
  }

  // Se retornou um único objeto em data
  if (raw.data && typeof raw.data === 'object') {
    const item = raw.data;
    if (item.attributes) return [{ id: item.id, ...item.attributes }];
    return [item];
  }

  return [];
}

/**
 * Busca todos os pedidos, lidando com paginação do Strapi.
 * @param populate string (ex: '*' ou 'itens_sacola,algumaRelacao')
 * @param pageSize números por página (padrão 100)
 */
export async function getAllPedidosAllPages(populate = '*', pageSize = 100) {
  if (!STRAPI_API_URL) throw new Error('VITE_STRAPI_API_URL não definido');
  const headers: Record<string,string> = {};
  if (ADMIN_TOKEN) headers['Authorization'] = `Bearer ${ADMIN_TOKEN}`;

  const firstUrl = `${STRAPI_API_URL}/pedidos?populate=${encodeURIComponent(populate)}&pagination[page]=1&pagination[pageSize]=${pageSize}`;
  const firstRes = await fetch(firstUrl, { headers });
  if (!firstRes.ok) {
    const txt = await firstRes.text();
    throw new Error(`Erro ao buscar pedidos (1): ${firstRes.status} — ${txt}`);
  }
  const firstJson = await firstRes.json();
  const results = normalizeStrapiList(firstJson);

  const pageCount = firstJson?.meta?.pagination?.pageCount ?? 1;
  if (pageCount <= 1) return results;

  // buscar demais páginas sequencialmente (poderia paralelizar se preferir)
  for (let p = 2; p <= pageCount; p++) {
    const url = `${STRAPI_API_URL}/pedidos?populate=${encodeURIComponent(populate)}&pagination[page]=${p}&pagination[pageSize]=${pageSize}`;
    const r = await fetch(url, { headers });
    if (!r.ok) {
      const t = await r.text();
      throw new Error(`Erro ao buscar pedidos (page ${p}): ${r.status} — ${t}`);
    }
    const j = await r.json();
    results.push(...normalizeStrapiList(j));
  }

  return results;
}

/** Atalho (uma chamada só, útil para testes rápidos) */
export async function getAllPedidosSimple(populate = '*') {
  const headers: Record<string,string> = {};
  if (ADMIN_TOKEN) headers['Authorization'] = `Bearer ${ADMIN_TOKEN}`;

  const res = await fetch(`${STRAPI_API_URL}/pedidos?populate=${encodeURIComponent(populate)}`, { headers });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Erro ao buscar pedidos: ${res.status} — ${txt}`);
  }
  const json = await res.json();
  return normalizeStrapiList(json);
}







/**
 * Deleta um pedido (Strapi v5)
 * idOuDocumentId: pode ser o id numérico do registro ou o documentId (string) se você usa documentos.
 */
export async function deletarPedido(idOuDocumentId: string | number) {
  if (!STRAPI_API_URL) throw new Error('VITE_STRAPI_API_URL não definido');

  const identifier = encodeURIComponent(String(idOuDocumentId));
  const url = `${STRAPI_API_URL}/pedidos/${identifier}`;

  const headers: Record<string, string> = {};
  if (ADMIN_TOKEN) headers['Authorization'] = `Bearer ${ADMIN_TOKEN}`;

  console.debug('[strapi] deletarPedido -> DELETE', url);

  const res = await fetch(url, {
    method: 'DELETE',
    headers,
  });

  // tenta ler corpo para mensagem de erro/retorno
  const text = await res.text().catch(() => '');
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }

  if (!res.ok) {
    throw new Error(`Erro ao deletar pedido ${idOuDocumentId}: ${res.status} — ${JSON.stringify(json)}`);
  }

  // Retorna o corpo (Strapi costuma retornar o objeto deletado ou vazio)
  return json;
}





/* ============================================================
 * ATUALIZAR PEDIDO (STRAPI v5) - usa documentId quando disponível
 * ============================================================ */

export async function atualizarPedido(
  idOuDocumentId: string | number,
  data: Record<string, any>,
  method: 'PUT' | 'PATCH' = 'PUT'   // <--- default PUT (Strapi v5 espera PUT aqui)
) {
  if (!STRAPI_API_URL) throw new Error('VITE_STRAPI_API_URL não definido');

  const identifier = encodeURIComponent(String(idOuDocumentId));
  const url = `${STRAPI_API_URL}/pedidos/${identifier}`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (ADMIN_TOKEN) headers['Authorization'] = `Bearer ${ADMIN_TOKEN}`;

  // DEBUG helper: log URL e payload (remova em produção)
  console.debug('[strapi] atualizarPedido ->', method, url, 'data=', data);

  const res = await fetch(url, {
    method,
    headers,
    body: JSON.stringify({ data }),
  });

  const text = await res.text().catch(() => '');
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }

  if (!res.ok) {
    // Jogar erro com o body para debug
    throw new Error(`Erro ao atualizar pedido ${idOuDocumentId}: ${res.status} — ${JSON.stringify(json)}`);
  }
  return json;
}

/**
 * Atualiza apenas o campo andamento do pedido.
 * Usa PUT por padrão (muda para 'PATCH' só se você souber que seu Strapi aceita).
 */
export async function atualizarAndamentoPedido(idOuDocumentId: string | number, andamento: string) {
  if (!['pendente','confirmado','cancelado','entregue'].includes(andamento)) {
    throw new Error('Valor de andamento inválido');
  }
  return atualizarPedido(idOuDocumentId, { andamento }, 'PUT'); // <- PUT aqui
}



/* ============================================================
 * BUSCAR INFORMAÇÕES DE PRODUTOS A PARTIR DE ticketPai(s)
 * Retorna um mapa { [ticketPai]: { title, image, estoqueUnico, variantes: { [ticket]: estoque }, documentId } }
 * ============================================================ */

function _stripApiPath(url: string) {
  if (!url) return url;
  // STRAPI_API_URL tem /api no final (no seu .env). transforma em base sem /api
  return STRAPI_API_URL ? String(STRAPI_API_URL).replace(/\/api\/?$/,'') : '';
}

function _absUrl(base: string, url?: string|null) {
  if (!url) return null;
  if (typeof url !== 'string') return null;
  if (url.startsWith('http')) return url;
  return `${base}${url}`;
}

function _findFirstImage(obj: any, base: string): string | null {
  const seen = new Set<any>();

  function recurse(o: any): string | null {
    if (!o || typeof o !== 'object') return null;
    if (seen.has(o)) return null;
    seen.add(o);

    // Strapi media shape: { data: [ { id, attributes: { url, formats } } ] }
    if (o.data && Array.isArray(o.data) && o.data.length > 0) {
      const candidate = o.data[0];
      const attrs = candidate.attributes ?? candidate;
      const url = attrs?.url || attrs?.formats?.thumbnail?.url || attrs?.formats?.small?.url || attrs?.formats?.medium?.url;
      if (url) return _absUrl(base, url);
    }

    // direct url
    if (typeof o.url === 'string' && o.url.trim()) return _absUrl(base, o.url);

    // sometimes image array sits directly as [{ attributes: { url } }]
    if (Array.isArray(o) && o.length > 0) {
      for (const el of o) {
        const r = recurse(el);
        if (r) return r;
      }
    }

    // iterate object keys
    for (const k of Object.keys(o)) {
      const r = recurse(o[k]);
      if (r) return r;
    }
    return null;
  }

  return recurse(obj);
}

/**
 * Busca produtos (detalhes) para um array de ticketPai(s).
 * Faz uma requisição por ticketPai (poderíamos paralelizar; 
 * para simplicidade usamos sequência).
 * Retorna um objeto: { [ticketPaiNumber]: produtoInfo | null }
 */
export async function getProdutosPorTicketPaises(ticketPais: (number | string)[]) {
  const base = _stripApiPath(String(STRAPI_API_URL ?? ''));
  const headers: Record<string,string> = {};
  if (ADMIN_TOKEN) headers['Authorization'] = `Bearer ${ADMIN_TOKEN}`;

  const map: Record<string, any> = {};

  // dedupe e normalize
  const unique = Array.from(new Set(ticketPais.map(tp => String(tp))));

  for (const tp of unique) {
    try {
      const res = await fetch(`${STRAPI_API_URL}/produtos?filters[ticketPai][$eq]=${encodeURIComponent(tp)}&populate=*`, { headers });
      if (!res.ok) {
        // se não encontrou, guarda null para esse ticketPai
        map[tp] = null;
        continue;
      }
      const json = await res.json();
      const raw = json?.data?.[0];
      if (!raw) { map[tp] = null; continue; }

      // normalizar item (v4/v5)
      const product = raw.attributes ? { id: raw.id, ...raw.attributes } : raw;

      // Tentar extrair título/nome (vários aliases comuns)
      const title =
        product.nome ??
        product.titulo ??
        product.title ??
        product.name ??
        product.produtoNome ??
        product.nomeProduto ??
        product.label ??
        null;

      // imagem: busca recursiva pela primeira url encontrada
      const image = _findFirstImage(product, base) ?? null;

      // estoqueUnico (vários aliases)
      const estoqueUnico =
        (product.estoqueUnico ?? product.estoque_unico ?? product.stock ?? product.estoque) ?? null;

      // variantes -> map ticket -> estoqueVariante (procura aliases)
      const variantesMap: Record<string, number | null> = {};
      const variantes = product.variantes ?? product.variantesProduto ?? product.variations ?? [];
      if (Array.isArray(variantes)) {
        for (const rawVar of variantes) {
          const v = rawVar.attributes ? { id: rawVar.id, ...rawVar.attributes } : rawVar;
          const ticket = v.ticket ?? v.ticketPai ?? v.documentId ?? v.id ?? null;
          const estoqueVar =
            (v.estoqueVariante ?? v.estoque_variante ?? v.estoque ?? v.stock ?? null);
          if (ticket !== null && ticket !== undefined) {
            variantesMap[String(ticket)] = estoqueVar ?? null;
          }
        }
      }

      map[tp] = {
        title: title ?? null,
        image,
        estoqueUnico,
        variantes: variantesMap,
        documentId: product.documentId ?? product.documentId ?? null,
        rawProduct: product, // opcional para debug
      };
    } catch (err) {
      console.error('[strapi] erro ao buscar produto ticketPai=', tp, err);
      map[tp] = null;
    }
  }

  return map;
}


/* ============================================================
 *Atualizar pagamento de um pedido
 * ============================================================ */
export async function atualizarPagamentoPedido(idOuDocumentId: string | number, pagamento: string) {
  // garante que o valor enviado ao Strapi esteja no formato esperado pela enum
  const valor = mapPagamentoToEnum(pagamento);
  return atualizarPedido(idOuDocumentId, { pagamento: valor }, 'PUT');
}


/* ============================================================
 * ATUALIZAR ENTREGA (com ajuste automático de comFrete / semFrete)
 * Regras:
 * - Ao definir entrega = "Entrega no Meukkul por (RS: 4,00)":
 *     comFrete = semFrete + 4  (se semFrete existir)
 *     semFrete = null (limpa)
 *     se semFrete não existir e comFrete existir, mantém comFrete
 *     se nenhum existir, define comFrete = 4
 * - Ao alterar para qualquer outra opção (remover a opção com frete):
 *     se comFrete existir -> semFrete = comFrete - 4 (mínimo 0) e comFrete = null
 * ============================================================ */
export async function atualizarEntregaPedido(idOuDocumentId: string | number, entrega: string) {
  const mapped = mapEntregaToEnum(entrega);
  if (!STRAPI_API_URL) throw new Error('VITE_STRAPI_API_URL não definido');

  // helper para transformar valores diversos em número (aceita "96", "96.00", "96,00", etc.)
  function toNumber(v: any): number | null {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return isNaN(v) ? null : v;
    if (typeof v === 'string') {
      const cleaned = v.replace(/[^\d\-,.]/g, '').trim();
      if (cleaned === '') return null;
      // normaliza: remove pontos de milhar e transforma vírgula decimal em ponto
      const normalized = cleaned.replace(/\./g, '').replace(/,/g, '.');
      const num = Number(normalized);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  // busca o pedido atual para ler comFrete / semFrete
  const identifier = encodeURIComponent(String(idOuDocumentId));
  const getUrl = `${STRAPI_API_URL}/pedidos/${identifier}?populate=*`;
  const headers: Record<string,string> = {};
  if (ADMIN_TOKEN) headers['Authorization'] = `Bearer ${ADMIN_TOKEN}`;

  const getRes = await fetch(getUrl, { headers });
  if (!getRes.ok) {
    const txt = await getRes.text().catch(()=> '');
    throw new Error(`Erro ao buscar pedido ${idOuDocumentId}: ${getRes.status} — ${txt}`);
  }
  const getJson = await getRes.json();

  // extrai atributos de forma robusta (v4/v5)
  let attrs: any = null;
  if (getJson?.data) {
    const d = getJson.data;
    attrs = d.attributes ?? d;
  } else {
    attrs = getJson;
  }

  const currentCom = toNumber(attrs?.comFrete ?? attrs?.com_frete ?? attrs?.comfrete ?? null);
  const currentSem = toNumber(attrs?.semFrete ?? attrs?.sem_frete ?? attrs?.semfrete ?? null);

  const FRETE_DELTA = 4;

  // payload parcial para enviar ao atualizarPedido
  const data: Record<string, any> = { entrega: mapped };

  if (mapped === 'Entrega no Meukkul por (RS: 4,00)') {
    // ativando frete pago: mover semFrete -> comFrete (+ R$4) e limpar semFrete
    if (currentSem != null) {
      const newCom = Number((currentSem + FRETE_DELTA).toFixed(2));
      data.comFrete = newCom;
      data.semFrete = null;
    } else if (currentCom != null) {
      // já tinha comFrete, mantém (mas garante número)
      data.comFrete = Number(currentCom.toFixed ? currentCom.toFixed(2) : Number(currentCom));
      data.semFrete = null;
    } else {
      // nenhum valor anterior — definir comFrete = 4
      data.comFrete = FRETE_DELTA;
      data.semFrete = null;
    }
  } else {
    // desativando opção de frete pago: se havia comFrete, transferir para semFrete subtraindo R$4
    if (currentCom != null) {
      let newSem = currentCom - FRETE_DELTA;
      if (newSem < 0) newSem = 0;
      data.semFrete = Number(newSem.toFixed(2));
      data.comFrete = null;
    }
    // caso não exista comFrete, não toca nos valores (mantém o que já estiver)
  }

  // chama helper existente para fazer o PUT
  return atualizarPedido(idOuDocumentId, data, 'PUT');
}

