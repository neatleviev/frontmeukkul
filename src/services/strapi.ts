const STRAPI_API_URL = import.meta.env.VITE_STRAPI_API_URL
const ADMIN_TOKEN = import.meta.env.VITE_STRAPI_ADMIN_TOKEN

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
  return json.data[0]
}
