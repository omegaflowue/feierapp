<template>
  <div class="card h-100 ride-request-card">
    <div class="card-header bg-warning text-dark">
      <div class="d-flex justify-content-between align-items-center">
        <h6 class="mb-0">
          <i class="fas fa-hand-paper me-2"></i>
          Mitfahrt-Gesuch
        </h6>
        <span class="badge bg-dark text-light">
          {{ request.passenger_count }} {{ request.passenger_count === 1 ? 'Person' : 'Personen' }}
        </span>
      </div>
    </div>
    
    <div class="card-body">
      <!-- Passenger Info -->
      <div class="d-flex align-items-center mb-3">
        <div class="avatar me-3">
          <i class="fas fa-user-circle fa-2x text-muted"></i>
        </div>
        <div>
          <h6 class="mb-0">{{ request.passenger?.name || 'Unbekannter Gast' }}</h6>
          <small class="text-muted">Mitfahrer gesucht</small>
        </div>
      </div>
      
      <!-- Request Details -->
      <div class="request-details">
        <div class="detail-item mb-2">
          <i class="fas fa-map-marker-alt text-warning me-2"></i>
          <strong>Abholung:</strong> {{ request.pickup_location }}
        </div>
        
        <div class="detail-item mb-2">
          <i class="fas fa-users text-warning me-2"></i>
          <strong>Personen:</strong> {{ request.passenger_count }}
        </div>
        
        <div class="detail-item mb-2">
          <i class="fas fa-exchange-alt text-warning me-2"></i>
          <strong>Flexibilität:</strong> 
          {{ request.flexible_pickup ? 'Flexibel beim Abholort' : 'Fester Abholort' }}
        </div>
        
        <div class="detail-item mb-2">
          <i class="fas fa-clock text-warning me-2"></i>
          <strong>Erstellt:</strong> {{ formatDate(request.created_at) }}
        </div>
      </div>
      
      <!-- Notes -->
      <div v-if="request.notes" class="mt-3">
        <h6 class="text-muted">Hinweise:</h6>
        <p class="text-muted small">{{ request.notes }}</p>
      </div>
      
      <!-- Status -->
      <div class="mt-3">
        <span 
          class="badge"
          :class="{
            'bg-success': request.status === 'open',
            'bg-primary': request.status === 'matched',
            'bg-secondary': request.status === 'cancelled'
          }"
        >
          {{ getStatusText(request.status) }}
        </span>
        
        <span v-if="request.confirmed_match" class="badge bg-info ms-2">
          <i class="fas fa-check me-1"></i>
          Mitfahrt bestätigt
        </span>
      </div>
    </div>
    
    <div class="card-footer">
      <div class="d-grid gap-2">
        <button 
          v-if="canOffer && request.status === 'open'"
          class="btn btn-warning text-dark"
          @click="offerRide"
          :disabled="offering"
        >
          <span v-if="offering" class="spinner-border spinner-border-sm me-2"></span>
          <i v-else class="fas fa-car me-2"></i>
          {{ offering ? 'Wird angeboten...' : 'Mitfahrt anbieten' }}
        </button>
        
        <button 
          v-else-if="request.status === 'matched'"
          class="btn btn-success"
          disabled
        >
          <i class="fas fa-check me-2"></i>
          Bereits vermittelt
        </button>
        
        <button 
          v-else-if="!canOffer"
          class="btn btn-outline-warning"
          @click="$emit('authentication-required')"
        >
          <i class="fas fa-sign-in-alt me-2"></i>
          Anmelden um anzubieten
        </button>
      </div>
      
      <!-- Match Info (only shown after successful offer) -->
      <div v-if="showMatchInfo" class="mt-2 pt-2 border-top">
        <small class="text-success">
          <i class="fas fa-check-circle me-1"></i>
          Mitfahrgelegenheit angeboten! Der Gast wird benachrichtigt.
        </small>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RideRequestCard',
  props: {
    request: {
      type: Object,
      required: true
    },
    canOffer: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      offering: false,
      showMatchInfo: false
    }
  },
  methods: {
    async offerRide() {
      this.offering = true
      try {
        await this.$emit('offer-ride', this.request)
        this.showMatchInfo = true
      } catch (error) {
        console.error('Error offering ride:', error)
      } finally {
        this.offering = false
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return 'Nicht angegeben'
      
      const date = new Date(dateString)
      return date.toLocaleString('de-DE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    getStatusText(status) {
      const statusMap = {
        'open': 'Offen',
        'matched': 'Vermittelt',
        'cancelled': 'Storniert'
      }
      return statusMap[status] || status
    }
  }
}
</script>

<style scoped>
.ride-request-card {
  transition: all 0.2s ease-in-out;
  border: 1px solid #dee2e6;
}

.ride-request-card:hover {
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
  border-bottom: 1px solid rgba(0,0,0,0.1);
}

.badge {
  font-size: 0.75rem;
}

.request-details {
  border-left: 3px solid #ffc107;
  padding-left: 15px;
}

.btn {
  border-radius: 6px;
}

.btn-warning {
  background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
  border: none;
  color: #212529;
}

.btn-warning:hover {
  background: linear-gradient(135deg, #e0a800 0%, #d39e00 100%);
  color: #212529;
}

.btn-success {
  background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
  border: none;
}

.text-success {
  color: #28a745 !important;
}
</style>