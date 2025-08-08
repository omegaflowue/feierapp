<template>
  <div class="card ride-request-form">
    <div class="card-header bg-warning text-dark">
      <h5 class="mb-0">
        <i class="fas fa-hand-paper me-2"></i>
        Mitfahrt suchen
      </h5>
    </div>
    
    <div class="card-body">
      <form @submit.prevent="submitRequest">
        <div class="row">
          <div class="col-md-8 mb-3">
            <label for="pickup_location" class="form-label">Gewünschter Abholort *</label>
            <input 
              type="text" 
              class="form-control"
              id="pickup_location"
              name="pickup_location"
              v-model="request.pickup_location"
              required
              placeholder="z.B. S-Bahnhof Marienplatz oder Ihre Adresse"
            >
            <div class="form-text">
              <i class="fas fa-map-marker-alt me-1"></i>
              Geben Sie an, wo Sie abgeholt werden möchten
            </div>
          </div>
          
          <div class="col-md-4 mb-3">
            <label for="passenger_count" class="form-label">Anzahl Personen *</label>
            <select 
              class="form-select"
              id="passenger_count"
              name="passenger_count"
              v-model="request.passenger_count"
              required
            >
              <option value="1">1 Person</option>
              <option value="2">2 Personen</option>
              <option value="3">3 Personen</option>
              <option value="4">4 Personen</option>
              <option value="5">5 Personen</option>
              <option value="6">6 Personen</option>
            </select>
          </div>
        </div>
        
        <div class="mb-3">
          <div class="form-check">
            <input 
              class="form-check-input" 
              type="checkbox" 
              id="flexible_pickup"
              name="flexible_pickup"
              v-model="request.flexible_pickup"
            >
            <label class="form-check-label" for="flexible_pickup">
              <i class="fas fa-exchange-alt me-1"></i>
              Flexibel beim Abholort
            </label>
          </div>
          <div class="form-text">
            Aktivieren Sie diese Option, wenn Sie auch von einem anderen Ort in der Nähe abgeholt werden können
          </div>
        </div>
        
        <div class="mb-4">
          <label for="notes" class="form-label">Zusätzliche Informationen</label>
          <textarea 
            class="form-control"
            id="notes"
            name="notes"
            rows="3"
            v-model="request.notes"
            placeholder="z.B. Gepäck, besondere Wünsche, alternative Abhororte, etc."
          ></textarea>
          <div class="form-text">
            Teilen Sie weitere Details mit, die für Fahrer hilfreich sein könnten
          </div>
        </div>
        
        <!-- Info Box -->
        <div class="alert alert-info" role="alert">
          <i class="fas fa-info-circle me-2"></i>
          <strong>So funktioniert's:</strong>
          <ul class="mb-0 mt-2">
            <li>Ihr Gesuch wird anderen Gästen angezeigt</li>
            <li>Fahrer können Ihnen eine Mitfahrt anbieten</li>
            <li>Sie erhalten eine Benachrichtigung bei Angeboten</li>
            <li>Nach der Bestätigung erhalten Sie die Kontaktdaten</li>
          </ul>
        </div>
        
        <div v-if="error" class="alert alert-danger" role="alert">
          <i class="fas fa-exclamation-triangle me-2"></i>
          {{ error }}
        </div>
        
        <div class="d-grid gap-2">
          <button 
            type="submit" 
            class="btn btn-warning btn-lg text-dark"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="fas fa-hand-paper me-2"></i>
            {{ loading ? 'Wird erstellt...' : 'Mitfahrt-Gesuch erstellen' }}
          </button>
          
          <button 
            type="button" 
            class="btn btn-outline-secondary"
            @click="$emit('cancel')"
            :disabled="loading"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { rideService } from '../services/api'

export default {
  name: 'RideRequestForm',
  props: {
    eventCode: {
      type: String,
      required: true
    },
    guestToken: {
      type: String,
      required: true
    },
    guestInfo: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      request: {
        pickup_location: '',
        flexible_pickup: false,
        passenger_count: 1,
        notes: '',
        guest_token: this.guestToken
      },
      loading: false,
      error: null
    }
  },
  methods: {
    async submitRequest() {
      this.loading = true
      this.error = null
      
      try {
        const response = await rideService.createRequest(this.eventCode, this.request)
        this.$emit('request-created', response.data)
        this.resetForm()
      } catch (error) {
        console.error('Error creating ride request:', error)
        this.error = error.response?.data?.errors 
          ? Object.values(error.response.data.errors).flat().join(', ')
          : 'Fehler beim Erstellen des Mitfahrt-Gesuchs. Bitte versuchen Sie es erneut.'
      } finally {
        this.loading = false
      }
    },
    
    resetForm() {
      this.request = {
        pickup_location: '',
        flexible_pickup: false,
        passenger_count: 1,
        notes: '',
        guest_token: this.guestToken
      }
    }
  }
}
</script>

<style scoped>
.ride-request-form {
  max-width: 700px;
  margin: 0 auto;
}

.form-label {
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
}

.form-control, .form-select {
  border-radius: 8px;
  border: 1px solid #ced4da;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus, .form-select:focus {
  border-color: #ffc107;
  box-shadow: 0 0 0 0.2rem rgba(255, 193, 7, 0.25);
}

.form-check-input:checked {
  background-color: #ffc107;
  border-color: #ffc107;
}

.form-check-input:focus {
  border-color: #ffc107;
  box-shadow: 0 0 0 0.2rem rgba(255, 193, 7, 0.25);
}

.form-text {
  font-size: 0.875rem;
  color: #6c757d;
}

.btn {
  border-radius: 8px;
  font-weight: 600;
}

.btn-warning {
  background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
  border: none;
  color: #212529;
}

.btn-warning:hover:not(:disabled) {
  background: linear-gradient(135deg, #e0a800 0%, #d39e00 100%);
  color: #212529;
}

.btn-warning:disabled {
  opacity: 0.6;
}

.card {
  border: 1px solid #dee2e6;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card-header {
  border-bottom: 1px solid rgba(0,0,0,0.1);
  border-radius: 12px 12px 0 0 !important;
}

.alert {
  border-radius: 8px;
}

.alert-info {
  background-color: #d1ecf1;
  border-color: #bee5eb;
  color: #0c5460;
}

.alert-info ul {
  margin-left: 1rem;
}

.alert-info li {
  margin-bottom: 0.25rem;
}
</style>