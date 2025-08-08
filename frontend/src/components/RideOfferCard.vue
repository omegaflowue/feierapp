<template>
  <div class="card h-100 ride-offer-card">
    <div class="card-header bg-primary text-white">
      <div class="d-flex justify-content-between align-items-center">
        <h6 class="mb-0">
          <i class="fas fa-car me-2"></i>
          Mitfahrgelegenheit
        </h6>
        <span class="badge bg-light text-dark">
          {{ offer.remaining_seats }} Plätze frei
        </span>
      </div>
    </div>
    
    <div class="card-body">
      <!-- Driver Info -->
      <div class="d-flex align-items-center mb-3">
        <div class="avatar me-3">
          <i class="fas fa-user-circle fa-2x text-muted"></i>
        </div>
        <div>
          <h6 class="mb-0">{{ offer.driver?.name || 'Unbekannter Fahrer' }}</h6>
          <small class="text-muted">Fahrer</small>
        </div>
      </div>
      
      <!-- Trip Details -->
      <div class="trip-details">
        <div class="detail-item mb-2">
          <i class="fas fa-map-marker-alt text-primary me-2"></i>
          <strong>Abfahrt:</strong> {{ offer.departure_location }}
        </div>
        
        <div class="detail-item mb-2">
          <i class="fas fa-clock text-primary me-2"></i>
          <strong>Zeit:</strong> {{ formatDateTime(offer.departure_time) }}
        </div>
        
        <div class="detail-item mb-2">
          <i class="fas fa-users text-primary me-2"></i>
          <strong>Verfügbare Plätze:</strong> {{ offer.remaining_seats }} / {{ offer.available_seats }}
        </div>
        
        <div v-if="offer.car_description" class="detail-item mb-2">
          <i class="fas fa-car text-primary me-2"></i>
          <strong>Fahrzeug:</strong> {{ offer.car_description }}
        </div>
      </div>
      
      <!-- Notes -->
      <div v-if="offer.notes" class="mt-3">
        <h6 class="text-muted">Hinweise:</h6>
        <p class="text-muted small">{{ offer.notes }}</p>
      </div>
      
      <!-- Status -->
      <div class="mt-3">
        <span 
          class="badge"
          :class="{
            'bg-success': offer.status === 'active',
            'bg-warning': offer.status === 'full',
            'bg-secondary': offer.status === 'cancelled'
          }"
        >
          {{ getStatusText(offer.status) }}
        </span>
        
        <span v-if="offer.confirmed_matches_count > 0" class="badge bg-info ms-2">
          {{ offer.confirmed_matches_count }} bestätigte Mitfahrer
        </span>
      </div>
    </div>
    
    <div class="card-footer">
      <div class="d-grid gap-2">
        <button 
          v-if="canRequest && offer.status === 'active' && offer.remaining_seats > 0"
          class="btn btn-primary"
          @click="requestRide"
          :disabled="requesting"
        >
          <span v-if="requesting" class="spinner-border spinner-border-sm me-2"></span>
          <i v-else class="fas fa-hand-paper me-2"></i>
          {{ requesting ? 'Wird angefragt...' : 'Mitfahrt anfragen' }}
        </button>
        
        <button 
          v-else-if="offer.status === 'full'"
          class="btn btn-secondary"
          disabled
        >
          <i class="fas fa-times me-2"></i>
          Keine Plätze verfügbar
        </button>
        
        <button 
          v-else-if="!canRequest"
          class="btn btn-outline-primary"
          @click="$emit('authentication-required')"
        >
          <i class="fas fa-sign-in-alt me-2"></i>
          Anmelden um anzufragen
        </button>
      </div>
      
      <!-- Contact Info (only shown after successful request) -->
      <div v-if="showContactInfo" class="mt-2 pt-2 border-top">
        <small class="text-muted">
          <i class="fas fa-phone me-1"></i>
          Kontakt: {{ offer.contact_info || 'Siehe Event-Einladung' }}
        </small>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RideOfferCard',
  props: {
    offer: {
      type: Object,
      required: true
    },
    canRequest: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      requesting: false,
      showContactInfo: false
    }
  },
  methods: {
    async requestRide() {
      this.requesting = true
      try {
        await this.$emit('request-ride', this.offer)
        this.showContactInfo = true
      } catch (error) {
        console.error('Error requesting ride:', error)
      } finally {
        this.requesting = false
      }
    },
    
    formatDateTime(dateString) {
      if (!dateString) return 'Nicht angegeben'
      
      const date = new Date(dateString)
      return date.toLocaleString('de-DE', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    getStatusText(status) {
      const statusMap = {
        'active': 'Verfügbar',
        'full': 'Belegt',
        'cancelled': 'Abgesagt'
      }
      return statusMap[status] || status
    }
  }
}
</script>

<style scoped>
.ride-offer-card {
  transition: all 0.2s ease-in-out;
  border: 1px solid #dee2e6;
}

.ride-offer-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  font-size: 0.9rem;
}

.detail-item i {
  width: 16px;
  margin-top: 2px;
}

.card-header {
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.badge {
  font-size: 0.75rem;
}

.trip-details {
  border-left: 3px solid #007bff;
  padding-left: 15px;
}

.btn {
  border-radius: 6px;
}

.btn-primary {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  border: none;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
}
</style>