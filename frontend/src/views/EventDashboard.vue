<template>
  <div class="event-dashboard">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Event Dashboard</h1>
      <router-link to="/" class="btn btn-secondary">Zurück zur Startseite</router-link>
    </div>
    
    <div v-if="loading" class="text-center">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    
    <div v-else-if="event" class="row">
      <div class="col-md-8">
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="mb-0">{{ event.title }}</h5>
          </div>
          <div class="card-body">
            <p><strong>Datum:</strong> {{ formatDate(event.event_date) }}</p>
            <p><strong>Ort:</strong> {{ event.location }}</p>
            <p><strong>Beschreibung:</strong> {{ event.description }}</p>
            <p><strong>Event-Code:</strong> <code>{{ $route.params.code }}</code></p>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Gäste</h5>
            <button class="btn btn-primary btn-sm" @click="openAddGuestModal">
              Gast hinzufügen
            </button>
          </div>
          <div class="card-body">
            <div v-if="guests.length === 0" class="text-muted">
              Noch keine Gäste eingeladen
            </div>
            <div v-else class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Kinder</th>
                    <th>Allergien</th>
                    <th>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="guest in guests" :key="guest.id">
                    <td>{{ guest.name }}</td>
                    <td>{{ guest.email || '-' }}</td>
                    <td>
                      <span class="badge" :class="getStatusClass(guest.status)">
                        {{ getStatusText(guest.status) }}
                      </span>
                    </td>
                    <td>{{ guest.children_count || 0 }}</td>
                    <td>
                      <span v-if="guest.dietary_restrictions" 
                            class="text-warning" 
                            :title="guest.dietary_restrictions">
                        <i class="fas fa-exclamation-triangle"></i>
                        {{ guest.dietary_restrictions.length > 20 ? guest.dietary_restrictions.substring(0, 20) + '...' : guest.dietary_restrictions }}
                      </span>
                      <span v-else class="text-muted">Keine</span>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary" @click="copyInviteLink(guest)">
                        Link kopieren
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-4">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Statistiken</h5>
          </div>
          <div class="card-body">
            <div class="row text-center">
              <div class="col-4">
                <div class="h3 text-success">{{ acceptedCount }}</div>
                <small class="text-muted">Zusagen</small>
              </div>
              <div class="col-4">
                <div class="h3 text-danger">{{ declinedCount }}</div>
                <small class="text-muted">Absagen</small>
              </div>
              <div class="col-4">
                <div class="h3 text-warning">{{ pendingCount }}</div>
                <small class="text-muted">Offen</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="alert alert-danger">
      Event nicht gefunden
    </div>

    <!-- Add Guest Modal -->
    <div class="modal fade" id="addGuestModal" tabindex="-1" ref="addGuestModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-user-plus me-2"></i>
              Gast hinzufügen
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="addGuest">
              <div class="mb-3">
                <label for="guestName" class="form-label">Name *</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="guestName"
                  v-model="newGuest.name"
                  required
                  placeholder="z.B. Max Mustermann"
                >
              </div>
              
              <div class="mb-3">
                <label for="guestEmail" class="form-label">E-Mail</label>
                <input 
                  type="email" 
                  class="form-control" 
                  id="guestEmail"
                  v-model="newGuest.email"
                  placeholder="max@example.com"
                >
              </div>
              
              <div class="mb-3">
                <label for="guestPhone" class="form-label">Telefon</label>
                <input 
                  type="tel" 
                  class="form-control" 
                  id="guestPhone"
                  v-model="newGuest.phone"
                  placeholder="+49 123 456789"
                >
              </div>
              
              <div class="mb-3">
                <label for="guestAllergies" class="form-label">Allergien / Unverträglichkeiten</label>
                <textarea 
                  class="form-control" 
                  id="guestAllergies"
                  v-model="newGuest.dietary_restrictions"
                  rows="3"
                  placeholder="z.B. Nussallergie, Laktoseintoleranz, Vegetarisch, Vegan..."
                ></textarea>
                <div class="form-text">
                  Bitte alle relevanten Allergien und Ernährungseinschränkungen angeben
                </div>
              </div>

              <div v-if="guestError" class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                {{ guestError }}
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Abbrechen
            </button>
            <button 
              type="button" 
              class="btn btn-primary"
              @click="addGuest"
              :disabled="guestLoading || !newGuest.name.trim()"
            >
              <span v-if="guestLoading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="fas fa-plus me-2"></i>
              {{ guestLoading ? 'Wird hinzugefügt...' : 'Gast hinzufügen' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { eventService } from '@/services/api'
import { Modal } from 'bootstrap'

export default {
  name: 'EventDashboard',
  data() {
    return {
      loading: true,
      event: null,
      guests: [],
      showAddGuestModal: false,
      newGuest: {
        name: '',
        email: '',
        phone: '',
        dietary_restrictions: ''
      },
      guestLoading: false,
      guestError: null
    }
  },
  computed: {
    acceptedCount() {
      return this.guests.filter(g => g.status === 'accepted').length
    },
    declinedCount() {
      return this.guests.filter(g => g.status === 'declined').length
    },
    pendingCount() {
      return this.guests.filter(g => g.status === 'pending').length
    }
  },
  async mounted() {
    await this.loadEvent()
    await this.loadGuests()
  },
  methods: {
    async loadEvent() {
      try {
        const response = await eventService.get(this.$route.params.code)
        this.event = response.data
      } catch (error) {
        console.error('Error loading event:', error)
      }
    },
    async loadGuests() {
      try {
        const response = await eventService.getGuests(this.$route.params.code)
        this.guests = response.data || []
      } catch (error) {
        console.error('Error loading guests:', error)
        this.guests = []
      } finally {
        this.loading = false
      }
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleString('de-DE')
    },
    getStatusClass(status) {
      const classes = {
        'pending': 'bg-warning',
        'accepted': 'bg-success',
        'declined': 'bg-danger'
      }
      return classes[status] || 'bg-secondary'
    },
    getStatusText(status) {
      const texts = {
        'pending': 'Ausstehend',
        'accepted': 'Zugesagt',
        'declined': 'Abgesagt'
      }
      return texts[status] || status
    },
    copyInviteLink(guest) {
      const link = `${window.location.origin}/guest/${guest.unique_token}`
      navigator.clipboard.writeText(link)
      alert('Einladungslink kopiert!')
    },
    
    openAddGuestModal() {
      // Reset form
      this.newGuest = {
        name: '',
        email: '',
        phone: '',
        dietary_restrictions: ''
      }
      this.guestError = null
      
      // Show modal
      const modal = new Modal(this.$refs.addGuestModal)
      modal.show()
    },
    
    async addGuest() {
      if (!this.newGuest.name.trim()) {
        this.guestError = 'Name ist erforderlich'
        return
      }
      
      this.guestLoading = true
      this.guestError = null
      
      try {
        const response = await eventService.addGuest(this.$route.params.code, this.newGuest)
        
        // Add guest to local list
        this.guests.push(response.data)
        
        // Close modal
        const modal = Modal.getInstance(this.$refs.addGuestModal)
        if (modal) {
          modal.hide()
        }
        
        // Show success message
        alert('Gast wurde erfolgreich hinzugefügt!')
        
      } catch (error) {
        console.error('Error adding guest:', error)
        this.guestError = error.response?.data?.error || 'Fehler beim Hinzufügen des Gastes'
      } finally {
        this.guestLoading = false
      }
    }
  },
  
  beforeUnmount() {
    // Clean up any open modals
    const modal = Modal.getInstance(this.$refs.addGuestModal)
    if (modal) {
      modal.dispose()
    }
  }
}
</script>