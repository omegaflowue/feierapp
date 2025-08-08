<template>
  <div class="create-event">
    <div class="row justify-content-center">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header">
            <h3 class="mb-0">
              <i class="fas fa-calendar-plus me-2"></i>
              Neues Event erstellen
            </h3>
          </div>
          <div class="card-body">
            <form @submit.prevent="createEvent">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="title" class="form-label">Titel *</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="title"
                    name="title"
                    v-model="event.title"
                    required
                    placeholder="z.B. Geburtstag von Maria"
                  >
                </div>
                
                <div class="col-md-6 mb-3">
                  <label for="event_date" class="form-label">Datum & Uhrzeit *</label>
                  <input 
                    type="datetime-local" 
                    class="form-control" 
                    id="event_date"
                    v-model="event.event_date"
                    required
                  >
                </div>
              </div>

              <div class="mb-3">
                <label for="location" class="form-label">Ort *</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="location"
                  name="location"
                  v-model="event.location"
                  required
                  placeholder="z.B. Musterstraße 123, 12345 Musterstadt"
                >
              </div>

              <div class="mb-3">
                <label for="description" class="form-label">Beschreibung</label>
                <textarea 
                  class="form-control" 
                  id="description"
                  name="description"
                  rows="3"
                  v-model="event.description"
                  placeholder="Weitere Details zur Feier..."
                ></textarea>
              </div>

              <hr>

              <h5 class="mb-3">Ihre Kontaktdaten</h5>
              
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="planner_name" class="form-label">Ihr Name *</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="planner_name"
                    name="planner_name"
                    v-model="event.planner_name"
                    required
                    placeholder="Max Mustermann"
                  >
                </div>
                
                <div class="col-md-6 mb-3">
                  <label for="planner_email" class="form-label">Ihre E-Mail *</label>
                  <input 
                    type="email" 
                    class="form-control" 
                    id="planner_email"
                    name="planner_email"
                    v-model="event.planner_email"
                    required
                    placeholder="max@example.com"
                  >
                </div>
              </div>

              <div class="mb-4">
                <label for="planner_phone" class="form-label">Ihre Telefonnummer</label>
                <input 
                  type="tel" 
                  class="form-control" 
                  id="planner_phone"
                  name="planner_phone"
                  v-model="event.planner_phone"
                  placeholder="+49 123 456789"
                >
              </div>

              <div v-if="error" class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                {{ error }}
              </div>

              <div class="d-grid gap-2">
                <button type="submit" class="btn btn-primary btn-lg" :disabled="loading">
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                  <i v-else class="fas fa-plus me-2"></i>
                  {{ loading ? 'Event wird erstellt...' : 'Event erstellen' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <div class="modal fade" id="successModal" tabindex="-1" ref="successModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title">
              <i class="fas fa-check-circle me-2"></i>
              Event erfolgreich erstellt!
            </h5>
          </div>
          <div class="modal-body">
            <p class="mb-3">Ihr Event wurde erfolgreich erstellt. Hier sind die wichtigsten Informationen:</p>
            
            <div class="card">
              <div class="card-body">
                <h6 class="card-title">{{ createdEvent?.title || 'Event' }}</h6>
                <p class="card-text">
                  <small class="text-muted">
                    <i class="fas fa-calendar me-1"></i>
                    {{ createdEvent?.event_date ? formatDate(createdEvent.event_date) : '' }}
                    <br>
                    <i class="fas fa-map-marker-alt me-1"></i>
                    {{ createdEvent?.location || '' }}
                  </small>
                </p>
                
                <div class="alert alert-info mb-0">
                  <strong>Event-Code:</strong>
                  <code class="ms-2">{{ createdEvent?.unique_code || '' }}</code>
                  <button 
                    class="btn btn-sm btn-outline-info ms-2" 
                    @click="copyToClipboard(createdEvent?.unique_code)"
                  >
                    <i class="fas fa-copy"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-primary"
              @click="goToEventDashboard"
            >
              Zum Event-Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { eventService } from '../services/api'
import { Modal } from 'bootstrap'

export default {
  name: 'CreateEvent',
  data() {
    return {
      event: {
        title: '',
        description: '',
        event_date: '',
        location: '',
        planner_name: '',
        planner_email: '',
        planner_phone: ''
      },
      loading: false,
      error: null,
      createdEvent: null
    }
  },
  methods: {
    async createEvent() {
      this.loading = true
      this.error = null
      
      try {
        const response = await eventService.create(this.event)
        this.createdEvent = response.data
        
        const modal = new Modal(this.$refs.successModal)
        modal.show()
        
      } catch (error) {
        console.log('Full error object:', error)
        console.log('Error response:', error.response)
        console.log('Error status:', error.response?.status)
        console.log('Error data:', error.response?.data)
        
        this.error = error.response?.data?.errors 
          ? Object.values(error.response.data.errors).flat().join(', ')
          : `Fehler beim Erstellen des Events: ${error.message}. Status: ${error.response?.status || 'Keine Verbindung'}`
      } finally {
        this.loading = false
      }
    },
    
    goToEventDashboard() {
      if (this.createdEvent?.unique_code) {
        // Close modal before navigation
        const modal = Modal.getInstance(this.$refs.successModal)
        if (modal) {
          modal.hide()
        }
        
        // Navigate to event dashboard
        this.$router.push(`/event/${this.createdEvent.unique_code}`)
      }
    },
    
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text)
        // Show success feedback
      } catch (err) {
        console.error('Failed to copy text: ', err)
      }
    }
  },
  beforeUnmount() {
    // Clean up any open modals when component is destroyed
    const modal = Modal.getInstance(this.$refs.successModal)
    if (modal) {
      modal.dispose()
    }
  }
}
</script>

<style scoped>
.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.form-label {
  font-weight: 600;
  color: #495057;
}

.alert-info code {
  background-color: transparent;
  color: inherit;
  font-size: 1rem;
  font-weight: 600;
}

.modal-header.bg-success {
  border-bottom: 1px solid #c3e6cb;
}
</style>