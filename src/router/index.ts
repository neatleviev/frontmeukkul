import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  { 
    path: '/prateleira/:id',
    name: 'PrateleiraPage',
    component: () => import('../views/PrateleiraPage.vue'),
    props: true
  },
  {
    path: '/produto/:id',
    name: 'DetalhesProduto',
    component: () => import('@/views/detalhesProduto.vue'),
    props: true
  },
 {
  path: '/meubrinde/:id',
  name: 'brindes',
  component: () => import('@/views/brindes.vue'),
  props: true
  },
  {
  path: '/pedidos',
  name: 'Pedidos',
  component: () => import('@/views/Pedidos.vue'),
  props: true
}


]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
