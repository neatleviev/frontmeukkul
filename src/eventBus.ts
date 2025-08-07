// src/eventBus.ts
import mitt from 'mitt'

export type AppEvents = {
  'estoque-atualizado': void
}

const eventBus = mitt<AppEvents>()

export default eventBus
