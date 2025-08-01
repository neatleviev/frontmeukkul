// services/strapi.ts
const STRAPI_API_URL = import.meta.env.VITE_STRAPI_API_URL;
const STRAPI_RAW_URL = import.meta.env.VITE_STRAPI_RAW_URL;
const ADMIN_TOKEN = import.meta.env.VITE_STRAPI_ADMIN_TOKEN;

export async function criarPedido(pedido: {
  clienteNome: string;
  clienteWhatsapp?: string;
  total: number;
  andamento?: string;
  enviado?: boolean;
  produtos: { id: number }[];
}) {
  try {
    const payload = {
      data: {
        clienteNome: pedido.clienteNome,
        clienteWhatsapp: pedido.clienteWhatsapp || '',
        total: pedido.total,
        andamento: pedido.andamento || 'pendente',
        enviado: pedido.enviado || false,
        produtos: {
          connect: pedido.produtos,
        },
      },
    };

    const response = await fetch(`${STRAPI_API_URL}/pedidos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao criar pedido no Strapi:', error);
    throw error;
  }
}

export async function atualizarEstoqueUnico(produtoId: number, novoEstoque: number) {
  try {
    const response = await fetch(`${STRAPI_RAW_URL}/produtos/${produtoId}/estoque-unico`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify({
        estoqueUnico: novoEstoque,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao atualizar estoque do produto ${produtoId}: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao atualizar estoqueUnico:', error);
    throw error;
  }
}

// ✅ CORRIGIDO: usa id da variante (não mais o índice)
export async function atualizarEstoqueVariante(produtoId: number, varianteId: number, novoEstoque: number) {
  try {
    const response = await fetch(
      `${STRAPI_RAW_URL}/produtos/${produtoId}/variantes/${varianteId}/estoque-variavel`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          estoqueVariante: novoEstoque,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao atualizar estoque da variante: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao atualizar estoque da variante:', error);
    throw error;
  }
}
