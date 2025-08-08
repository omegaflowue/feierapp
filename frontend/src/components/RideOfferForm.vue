<template>
  <div class="card ride-offer-form">
    <div class="card-header bg-primary text-white">
      <h5 class="mb-0">
        <i class="fas fa-car me-2"></i>
        Mitfahrgelegenheit anbieten
      </h5>
    </div>
    
    <div class="card-body">
      <form @submit.prevent="submitOffer">
        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="departure_location" class="form-label">Abfahrtsort *</label>
            <input 
              type="text" 
              class="form-control"
              id="departure_location"
              name="departure_location"
              v-model="offer.departure_location"
              required
              placeholder="z.B. Hauptbahnhof München"
            >
            <div class="form-text">
              <i class="fas fa-info-circle me-1"></i>
              Geben Sie einen konkreten Abfahrtsort an
            </div>
          </div>
          
          <div class="col-md-6 mb-3">
            <label for="departure_time" class="form-label">Abfahrtszeit *</label>
            <input 
              type="datetime-local" 
              class="form-control"
              id="departure_time"
              name="departure_time"
              v-model="offer.departure_time"
              required
            >
          </div>
        </div>
        
        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="available_seats" class="form-label">Verfügbare Plätze *</label>
            <select 
              class="form-select"
              id="available_seats"
              name="available_seats"
              v-model="offer.available_seats"
              required
            >
              <option value="1">1 Platz</option>
              <option value="2">2 Plätze</option>
              <option value="3">3 Plätze</option>
              <option value="4">4 Plätze</option>
              <option value="5">5 Plätze</option>
              <option value="6">6 Plätze</option>
              <option value="7">7 Plätze</option>
              <option value="8">8 Plätze</option>
            </select>
          </div>
          
          <div class="col-md-6 mb-3">
            <label for="car_description" class="form-label">Fahrzeugbeschreibung</label>
            <input 
              type="text" 
              class="form-control"
              id="car_description"
              name="car_description"
              v-model="offer.car_description"
              placeholder="z.B. Roter VW Golf, Kennzeichen M-AB123"
            >
            <div class="form-text">Optional: Farbe, Modell, Kennzeichen</div>
          </div>
        </div>
        
        <div class="mb-3">
          <label for="contact_info" class="form-label">Kontaktinformation</label>
          <input 
            type="text" 
            class="form-control"
            id="contact_info"
            name="contact_info"
            v-model="offer.contact_info"
            :placeholder="defaultContactInfo"
          >
          <div class="form-text">
            <i class="fas fa-phone me-1"></i>
            Telefonnummer oder andere Kontaktmöglichkeit (optional)
          </div>
        </div>
        
        <div class="mb-4">
          <label for="notes" class="form-label">Zusätzliche Hinweise</label>
          <textarea 
            class="form-control"
            id="notes"
            name="notes"
            rows="3"
            v-model="offer.notes"
            placeholder="z.B. Nichtraucher, Hund dabei, Umweg möglich, etc."
          ></textarea>
        </div>
        
        <div v-if="error" class="alert alert-danger" role="alert">
          <i class="fas fa-exclamation-triangle me-2"></i>
          {{ error }}
        </div>
        
        <div class="d-grid gap-2">
          <button 
            type="submit" 
            class="btn btn-primary btn-lg"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="fas fa-car me-2"></i>
            {{ loading ? 'Wird erstellt...' : 'Mitfahrgelegenheit anbieten' }}
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
  name: 'RideOfferForm',
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
      offer: {
        departure_location: '',
        departure_time: '',
        available_seats: 2,
        car_description: '',
        contact_info: '',
        notes: '',
        guest_token: this.guestToken
      },
      loading: false,
      error: null
    }
  },
  computed: {
    defaultContactInfo() {
      if (this.guestInfo.phone) {
        return `Standard: ${this.guestInfo.phone}`
      } else if (this.guestInfo.email) {
        return `Standard: ${this.guestInfo.email}`
      }
      return 'Ihre Kontaktdaten aus der Event-Einladung'
    }
  },
  mounted() {
    // Set default departure time to 2 hours before event
    this.setDefaultDepartureTime()
    
    // Pre-fill contact info if available
    if (this.guestInfo.phone) {
      this.offer.contact_info = this.guestInfo.phone
    } else if (this.guestInfo.email) {
      this.offer.contact_info = this.guestInfo.email
    }
  },
  methods: {
    async submitOffer() {
      this.loading = true
      this.error = null
      
      try {
        const response = await rideService.createOffer(this.eventCode, this.offer)
        this.$emit('offer-created', response.data)
        this.resetForm()
      } catch (error) {
        console.error('Error creating ride offer:', error)
        this.error = error.response?.data?.errors 
          ? Object.values(error.response.data.errors).flat().join(', ')
          : 'Fehler beim Erstellen der Mitfahrgelegenheit. Bitte versuchen Sie es erneut.'
      } finally {
        this.loading = false
      }
    },
    
    resetForm() {
      this.offer = {
        departure_location: '',
        departure_time: '',
        available_seats: 2,
        car_description: '',
        contact_info: this.guestInfo.phone || this.guestInfo.email || '',
        notes: '',
        guest_token: this.guestToken
      }
      this.setDefaultDepartureTime()
    },
    
    setDefaultDepartureTime() {
      // Set default time to current date + 1 day at 16:00
      const defaultDate = new Date()
      defaultDate.setDate(defaultDate.getDate() + 1)
      defaultDate.setHours(16, 0, 0, 0)
      
      // Format for datetime-local input
      const year = defaultDate.getFullYear()
      const month = String(defaultDate.getMonth() + 1).padStart(2, '0')
      const day = String(defaultDate.getDate()).padStart(2, '0')
      const hours = String(defaultDate.getHours()).padStart(2, '0')
      const minutes = String(defaultDate.getMinutes()).padStart(2, '0')
      
      this.offer.departure_time = `${year}-${month}-${day}T${hours}:${minutes}`
    }
  }
}
</script>

<style scoped>
.ride-offer-form {
  max-width: 800px;
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
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-text {
  font-size: 0.875rem;
  color: #6c757d;
}

.btn {
  border-radius: 8px;
  font-weight: 600;
}

.btn-primary {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
}

.btn-primary:disabled {
  opacity: 0.6;
}

.card {
  border: 1px solid #dee2e6;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card-header {
  border-bottom: 1px solid rgba(255,255,255,0.2);
  border-radius: 12px 12px 0 0 !important;
}

.alert {
  border-radius: 8px;
}

input[type="datetime-local"] {
  color: #495057;
}
</style>