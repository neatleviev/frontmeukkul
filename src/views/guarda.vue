<template>
  <div class="main-p-4">
    <h1 class="text-3xl font-bold mb-4 text-[#d56aa0] text-center">
      Produtos da Prateleira:
      <span v-if="prateleiraNome">{{ prateleiraNome }}</span>
      <span v-else-if="prateleiraId">ID {{ prateleiraId }}</span>
      <span v-else>Nenhuma Selecionada</span>
    </h1>

    <div class="mt-8 p-4 border rounded-lg shadow-md bg-white">

      <div v-if="error" class="text-red-500 mt-4">
        Erro ao carregar produtos: {{ error }}
        <p>Verifique o URL do Strapi, as permissões da API (`find` para `produto`, `prateleira` e `upload`) e se o ID da prateleira é válido.</p>
      </div>

      <div v-else-if="!prateleiraId && !loading" class="text-gray-500 mt-4">
        Por favor, forneça um ID de prateleira na URL (ex: `/prateleira/4`).
      </div>

      <div v-else-if="products.length === 0 && !loading && loaded && prateleiraId" class="text-gray-500 mt-4">
        Nenhum produto encontrado para a prateleira com ID {{ prateleiraId }}.
      </div>

      <div v-else-if="products.length > 0" class="mt-4">
       
        <ul class="list-disc ml-5">
          <li v-for="product in products" :key="product.id" class="mb-4 p-4 border-b last:border-b-0">
            <!-- DEBUG opcional -->
            <!-- <pre>{{ JSON.stringify(product.fotos, null, 2) }}</pre> -->

            <!-- Imagens antes do nome -->
            <div
              v-if="hasImages(product)"
              class="mb-2"
            >
              <div class="flex flex-wrap gap-2 mb-1">
                <div
                  v-for="foto in getFotosArray(product)"
                  :key="foto.id"
                  class="w-24 h-24 overflow-hidden rounded-md border border-gray-300"
                >
                  <img
                    :src="resolveImageUrl(foto)"
                    :alt="foto.alternativeText || foto.name || 'Imagem do produto'"
                    class="w-full h-full object-cover"
                  />
                </div>
              </div>
              <h4 class="text-xs text-gray-500">Imagens acima</h4>
            </div>
            <div v-else class="text-xs text-gray-500 mb-2">
              Nenhuma imagem para este produto.
            </div>

            <!-- Nome e dados do produto -->
            <span class="font-medium text-[#d56aa0] text-lg block">Nome: {{ product.nome || 'N/A' }}</span>
            <p class="text-sm text-gray-700">Preço: R$ {{ product.preco?.toFixed(2) || '0.00' }}</p>
            <p class="text-sm text-gray-700">Descrição: {{ product.descricao?.[0]?.children?.[0]?.text || 'Sem descrição' }}</p>
            <p class="text-sm text-gray-700">Estoque: {{ product.estoqueUnico || 'N/A' }}</p>

            <!-- Prateleiras relacionadas -->
            <div v-if="product.prateleiras?.data?.length" class="mt-2">
              <span class="text-sm font-semibold">Prateleiras:</span>
              <ul class="list-disc ml-4 text-xs text-gray-600">
                <li
                  v-for="prateleira in product.prateleiras.data"
                  :key="prateleira.id"
                  :class="{ 'font-bold text-[#d56aa0]': prateleira.id.toString() === prateleiraId }"
                >
                  {{ prateleira.attributes?.nome || 'N/A' }} (ID: {{ prateleira.id }})
                  <span
                    v-if="prateleira.id.toString() === prateleiraId"
                    class="text-green-500 text-xs"
                  >(Prateleira Atual)</span>
                </li>
              </ul>
            </div>
            <div v-else class="text-xs text-gray-500 mt-1">
              Nenhuma prateleira relacionada.
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

interface TextContent {
  type: string;
  text: string;
}

interface DescriptionItem {
  type: string;
  children: TextContent[];
}

interface PrateleiraAttributes {
  nome: string;
}

interface PrateleiraData {
  id: number;
  attributes: PrateleiraAttributes;
}

interface ImageAttributes {
  name: string;
  alternativeText: string | null;
  url: string;
}

interface ImageData {
  id: number;
  attributes?: ImageAttributes;
  name?: string;
  alternativeText?: string | null;
  url?: string;
}

interface Product {
  id: number;
  nome: string;
  descricao: DescriptionItem[];
  preco: number;
  estoqueUnico?: number;
  fotos?: { data?: ImageData[] } | ImageData[];
  prateleiras?: { data: PrateleiraData[] };
}

const products = ref<Product[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const loaded = ref(false);
const prateleiraId = ref<string | null>(null);
const prateleiraNome = ref<string | null>(null);

const strapiUrl = 'https://nice-eggs-d79e24d7a7.strapiapp.com';

function hasImages(product: Product): boolean {
  const fotos = product.fotos;
  if (Array.isArray(fotos) && fotos.length > 0) return true;
  if ('data' in (fotos || {}) && Array.isArray(fotos.data) && fotos.data.length > 0) return true;
  return false;
}

function getFotosArray(product: Product): ImageData[] {
  const fotos = product.fotos;
  if (Array.isArray(fotos)) return fotos;
  if ('data' in (fotos || {}) && Array.isArray(fotos.data)) return fotos.data;
  return [];
}

function resolveImageUrl(foto: ImageData): string {
  if (foto.attributes?.url) return `${strapiUrl}${foto.attributes.url}`;
  if (foto.url?.startsWith('http')) return foto.url;
  return foto.url ? `${strapiUrl}${foto.url}` : '';
}

async function fetchPrateleiraName(id: string) {
  try {
    const response = await fetch(`${strapiUrl}/api/prateleiras?filters[id][$eq]=${id}`);
    const data = await response.json();
    prateleiraNome.value = data?.data?.[0]?.attributes?.nome || 'Desconhecida';
  } catch {
    prateleiraNome.value = 'Erro ao carregar nome';
  }
}


async function fetchProductsForPrateleira(id: string) {
  loading.value = true;
  error.value = null;
  products.value = [];
  loaded.value = false;
  prateleiraId.value = id;

  fetchPrateleiraName(id);

  try {
    const url = `${strapiUrl}/api/produtos?filters[prateleiras][id][$eq]=${id}&populate=*`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

    const responseData = await response.json();
    console.log(responseData.data)
    products.value = Array.isArray(responseData.data) ? responseData.data : [];

    
  } catch (err: any) {
    error.value = err.message || 'Erro desconhecido';
  } finally {
    loading.value = false;
    loaded.value = true;
  }



  

}

const refreshProducts = () => {
  const id = route.params.id as string | undefined;
  if (id) {
    fetchProductsForPrateleira(id);
  } else {
    products.value = [];
    loaded.value = true;
    error.value = null;
    prateleiraId.value = null;
    prateleiraNome.value = null;
  }
};

onMounted(() => refreshProducts());

watch(() => route.params.id, (newId) => {
  if (typeof newId === 'string' && newId !== prateleiraId.value) {
    refreshProducts();
  }
});

</script>

<style scoped>
.main-p-4 {
  padding: 1rem;
}
</style>
