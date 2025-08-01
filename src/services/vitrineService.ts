// src/services/vitrineService.ts
import axios from 'axios'

const API_URL = 'https://nice-eggs-d79e24d7a7.strapiapp.com/api'

export async function fetchSuperVitrines() {
  const { data } = await axios.get(
    `${API_URL}/super-vitrines?populate[produtos][populate]=fotos`
  )

  return data.data.map((vitrine: any) => ({
    id: vitrine.id,
    nome: vitrine.attributes.nome,
    produtos: vitrine.attributes.produtos.data.map((p: any) => ({
      id: p.id,
      nome: p.attributes.nome,
      preco: p.attributes.preco,
      fotos: p.attributes.fotos?.data?.map((foto: any) => ({
        url: foto.attributes.url,
        name: foto.attributes.name
      })) ?? [],
      estoqueUnico: p.attributes.estoqueUnico,
      variantes: p.attributes.variantes?.data ?? [],
      ticketPai: p.attributes.ticketPai
    }))
  }))
}
