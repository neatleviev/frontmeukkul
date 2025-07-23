<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ prateleiraId: string | null }>()

const loading = ref(false)
const error = ref<string | null>(null)
const data = ref<any[]>([])
const loaded = ref(false)

const strapiUrl = 'https://nice-eggs-d79e24d7a7.strapiapp.com'

async function fetchData(id: string) {
  loading.value = true
  error.value = null
  data.value = []
  loaded.value = false

  try {
    const res = await fetch(`${strapiUrl}/api/produtos?filters[prateleiras][id][$eq]=${id}&populate=*`)
    const json = await res.json()
    console.log(json.data)
    data.value = (json.data || []).map((product) => ({...product,
      descricaoTratada: (product.descricao || []).map(p => p.children?.[0]?.text || '')
    }));

    
  } catch (err: any) {
    error.value = err.message || 'Erro desconhecido'
  } finally {
    loading.value = false
    loaded.value = true
  }
}

watch(() => props.prateleiraId, (id) => {
  if (id) fetchData(id)
}, { immediate: true })
</script>

<template>
  <slot
    :loading="loading"
    :error="error"
    :data="data"
    :loaded="loaded"
  />
</template>
