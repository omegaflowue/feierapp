import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import CreateEvent from '../views/CreateEvent.vue'
import EventDashboard from '../views/EventDashboard.vue'
import GuestInvitation from '../views/GuestInvitation.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/create',
    name: 'CreateEvent',
    component: CreateEvent
  },
  {
    path: '/event/:code',
    name: 'EventDashboard',
    component: EventDashboard,
    props: true
  },
  {
    path: '/invite/:token',
    name: 'GuestInvitation',
    component: GuestInvitation,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router