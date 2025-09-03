// src/services/strapi.ts

const STRAPI_API_URL = import.meta.env.VITE_STRAPI_API_URL
const ADMIN_TOKEN = import.meta.env.VITE_STRAPI_ADMIN_TOKEN

/* ============================================================
 * ESTOQUE (SEU CÓDIGO ORIGINAL, INALTERADO)
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
 * BUSCAR PRODUTO POR TICKETPAI (SEU CÓDIGO ORIGINAL)
 * ============================================================ */
export async function buscarProdutoPorTicketPai(ticketPai: number) {
  const res = await fetch(
    `${STRAPI_API_URL}/produtos?filters[ticketPai]=${ticketPai}&populate=variantes`,
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
  return json.data[0] // objeto do produto (contém id, attributes, etc.)
}

/* ============================================================
 * MAPEAMENTO DAS ENUMS (FRONT -> STRAPI)
 * ============================================================ */
export function mapEntregaToEnum(codeOrText: string): "Vou retirar no Meukkul" | "Uber entrega no Meukkul" | "Entrega no Meukkul por (RS: 4,00)" {
  // Aceita tanto os "codes" usados no front quanto os textos já no padrão Strapi
  const val = (codeOrText || '').trim()
  if (val === 'retirada' || val === 'Vou retirar no Meukkul') return 'Vou retirar no Meukkul'
  if (val === 'uber' || val === 'Uber entrega no Meukkul') return 'Uber entrega no Meukkul'
  // IMPORTANTE: manter exatamente como cadastrado no Strapi (RS: 4,00)
  if (val === 'meukkul' || val === 'Entrega no Meukkul por (RS: 4,00)') return 'Entrega no Meukkul por (RS: 4,00)'
  // fallback: manter a terceira opção (evita 400 se vier algo inesperado)
  return 'Entrega no Meukkul por (RS: 4,00)'
}

export function mapPagamentoToEnum(codeOrText: string): "Pix" | "Link de pagamento" | "Dinheiro Vivo" | "Cartão de Crédito" {
  const val = (codeOrText || '').trim()
  if (val === 'pix' || val === 'Pix') return 'Pix'
  if (val === 'link' || val === 'Link de pagamento') return 'Link de pagamento'
  if (val === 'dinheiro' || val === 'Dinheiro Vivo') return 'Dinheiro Vivo'
  if (val === 'credito' || val === 'Cartão de Crédito') return 'Cartão de Crédito'
  // fallback: Pix
  return 'Pix'
}

/* ============================================================
 * GERAÇÃO DE CÓDIGO ÚNICO (CASO O UID NÃO SEJA AUTO-GERADO NO STRAPI)
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
  produto: number // id do produto no Strapi
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
  const data = {
    // se o UID não estiver auto-gerando, vamos enviar um código único
    codigo_unico: pedido.codigo_unico || gerarCodigoUnico(),
    primeiroNome: pedido.primeiroNome,
    andamento: pedido.andamento || 'pendente',
    comFrete: pedido.comFrete,
    semFrete: pedido.semFrete,
    entrega: pedido.entrega,
    pagamento: pedido.pagamento,
    itens_sacola: pedido.itens_sacola
  }

  const url = `${STRAPI_API_URL}/pedidos`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_TOKEN}`,
    },
    body: JSON.stringify({ data })
  })

  let json: any = null
  try {
    json = await res.json()
  } catch (_e) {
    // ignora parse caso não haja body
  }

  if (!res.ok) {
    console.error('[strapi] criarPedido erro', res.status, json)
    throw new Error(`Erro ao criar pedido: ${res.status} — ${JSON.stringify(json)}`)
  }

  console.log('[strapi] criarPedido OK:', json)
  return json
}
