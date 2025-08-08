<template>
  <div class="ride-board">
    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <i class="fas fa-car me-2"></i>
              Mitfahrgelegenheiten
            </h2>
            <div class="btn-group" role="group">
              <button 
                type="button" 
                class="btn btn-outline-primary" 
                :class="{ active: activeTab === 'offers' }"
                @click="activeTab = 'offers'"
              >
                <i class="fas fa-car me-1"></i>
                Angebote ({{ statistics.total_offers }})
              </button>
              <button 
                type="button" 
                class="btn btn-outline-secondary" 
                :class="{ active: activeTab === 'requests' }"
                @click="activeTab = 'requests'"
              >
                <i class="fas fa-hand-paper me-1"></i>
                Gesuche ({{ statistics.total_requests }})
              </button>
            </div>
          </div>

          <!-- Statistics Cards -->
          <div class="row mb-4">
            <div class="col-md-3">
              <div class="card text-center bg-primary text-white">
                <div class="card-body">
                  <i class="fas fa-car fa-2x mb-2"></i>
                  <h4>{{ statistics.total_offers }}</h4>
                  <small>Angebote</small>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card text-center bg-success text-white">
                <div class="card-body">
                  <i class="fas fa-check fa-2x mb-2"></i>
                  <h4>{{ statistics.active_offers }}</h4>
                  <small>Verfügbar</small>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card text-center bg-info text-white">
                <div class="card-body">
                  <i class="fas fa-users fa-2x mb-2"></i>
                  <h4>{{ statistics.total_available_seats }}</h4>
                  <small>Freie Plätze</small>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card text-center bg-warning text-white">
                <div class="card-body">
                  <i class="fas fa-hand-paper fa-2x mb-2"></i>
                  <h4>{{ statistics.open_requests }}</h4>
                  <small>Offene Gesuche</small>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Lade Mitfahrgelegenheiten...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>
            {{ error }}
          </div>

          <!-- Content Tabs -->
          <div v-else>
            <!-- Ride Offers Tab -->
            <div v-if="activeTab === 'offers'">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h4>Verfügbare Mitfahrgelegenheiten</h4>
                <small class="text-muted">{{ statistics.active_offers }} aktive Angebote</small>
              </div>
              
              <div v-if="offers.length === 0" class="text-center py-5">
                <i class="fas fa-car fa-3x text-muted mb-3"></i>
                <h5>Keine Mitfahrgelegenheiten verfügbar</h5>
                <p class="text-muted">Bisher hat noch niemand eine Mitfahrgelegenheit angeboten.</p>
              </div>
              
              <div v-else class="row">
                <div v-for="offer in offers" :key="offer.id" class="col-md-6 col-lg-4 mb-4">
                  <RideOfferCard 
                    :offer="offer"
                    :can-request="canRequestRide"
                    @request-ride="handleRideRequest"
                  />
                </div>
              </div>
            </div>

            <!-- Ride Requests Tab -->
            <div v-if="activeTab === 'requests'">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h4>Mitfahrt-Gesuche</h4>
                <small class="text-muted">{{ statistics.open_requests }} offene Gesuche</small>
              </div>
              
              <div v-if="requests.length === 0" class="text-center py-5">
                <i class="fas fa-hand-paper fa-3x text-muted mb-3"></i>
                <h5>Keine Mitfahrt-Gesuche</h5>
                <p class="text-muted">Bisher sucht noch niemand eine Mitfahrgelegenheit.</p>
              </div>
              
              <div v-else class="row">
                <div v-for="request in requests" :key="request.id" class="col-md-6 col-lg-4 mb-4">
                  <RideRequestCard 
                    :request="request"
                    :can-offer="canOfferRide"
                    @offer-ride="handleRideOffer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { rideService } from '../services/api'
import RideOfferCard from '../components/RideOfferCard.vue'
import RideRequestCard from '../components/RideRequestCard.vue'

export default {
  name: 'RideBoard',
  components: {
    RideOfferCard,
    RideRequestCard
  },
  props: {
    eventCode: {
      type: String,
      required: true
    },
    guestToken: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      activeTab: 'offers',
      offers: [],
      requests: [],
      statistics: {
        total_offers: 0,
        active_offers: 0,
        total_requests: 0,
        open_requests: 0,
        total_available_seats: 0
      },
      loading: false,
      error: null
    }
  },
  computed: {
    canRequestRide() {
      return !!this.guestToken
    },
    canOfferRide() {
      return !!this.guestToken
    }
  },
  mounted() {
    this.loadRides()
  },
  methods: {
    async loadRides() {
      this.loading = true
      this.error = null
      
      try {
        const response = await rideService.getRides(this.eventCode)
        this.offers = response.data.offers || []
        this.requests = response.data.requests || []
        this.statistics = response.data.statistics || this.statistics
      } catch (error) {
        console.error('Error loading rides:', error)
        this.error = 'Fehler beim Laden der Mitfahrgelegenheiten'
      } finally {
        this.loading = false
      }
    },
    
    async handleRideRequest(offer) {
      if (!this.guestToken) {
        this.$emit('guest-authentication-required')
        return
      }
      
      this.$emit('request-ride', { offer, guestToken: this.guestToken })
    },
    
    async handleRideOffer(request) {
      if (!this.guestToken) {
        this.$emit('guest-authentication-required')
        return
      }
      
      this.$emit('offer-ride', { request, guestToken: this.guestToken })
    },
    
    refresh() {
      this.loadRides()
    }
  }
}
</script>

<style scoped>
.ride-board {
  min-height: 60vh;
}

.btn-group .btn.active {
  background-color: var(--bs-primary);
  border-color: var(--bs-primary);
  color: white;
}

.card {
  transition: all 0.2s ease-in-out;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.statistics-card {
  border: none;
  border-radius: 10px;
}

.tab-content {
  min-height: 400px;
}
</style>