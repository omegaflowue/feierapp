<template>
  <div class="guest-invitation">
    <div class="container mt-4">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div v-if="loading" class="text-center">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          
          <div v-else-if="guest && event" class="card">
            <div class="card-header bg-primary text-white">
              <h4 class="mb-0">
                <i class="fas fa-birthday-cake me-2"></i>
                Einladung zu: {{ event.title }}
              </h4>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <h5>Event Details</h5>
                  <p><strong>Datum:</strong> {{ formatDate(event.event_date) }}</p>
                  <p><strong>Ort:</strong> {{ event.location }}</p>
                  <p><strong>Veranstalter:</strong> {{ event.planner_name }}</p>
                  <div v-if="event.description">
                    <strong>Beschreibung:</strong>
                    <p>{{ event.description }}</p>
                  </div>
                </div>
                <div class="col-md-6">
                  <h5>Ihre Antwort</h5>
                  <div class="mb-3">
                    <div class="form-check">
                      <input class="form-check-input" type="radio" name="response" id="accept" value="accepted" v-model="guestResponse.status">
                      <label class="form-check-label text-success" for="accept">
                        <i class="fas fa-check me-1"></i> Ich komme gerne!
                      </label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="radio" name="response" id="decline" value="declined" v-model="guestResponse.status">
                      <label class="form-check-label text-danger" for="decline">
                        <i class="fas fa-times me-1"></i> Ich kann leider nicht kommen
                      </label>
                    </div>
                  </div>
                  
                  <div v-if="guestResponse.status === 'accepted'">
                    <div class="mb-3">
                      <label for="children" class="form-label">Anzahl Kinder</label>
                      <input type="number" class="form-control" id="children" min="0" v-model.number="guestResponse.children_count">
                    </div>
                    <div class="mb-3">
                      <label for="dietary" class="form-label">Unverträglichkeiten/Diätwünsche</label>
                      <textarea class="form-control" id="dietary" rows="2" v-model="guestResponse.dietary_restrictions" placeholder="z.B. Vegetarisch, Nussallergie, etc."></textarea>
                    </div>
                    <div class="mb-3">
                      <label for="notes" class="form-label">Besondere Hinweise</label>
                      <textarea class="form-control" id="notes" rows="2" v-model="guestResponse.special_notes" placeholder="Weitere Hinweise oder Fragen"></textarea>
                    </div>
                  </div>
                  
                  <button class="btn btn-primary w-100" @click="submitResponse" :disabled="!guestResponse.status">
                    <i class="fas fa-paper-plane me-1"></i>
                    Antwort senden
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Anreise Section (only shown if guest accepted) -->
          <div v-if="guest && guest.status === 'accepted'" class="card mt-4">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="fas fa-car me-2"></i>
                Anreise & Mitfahrgelegenheiten
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-4 mb-3">
                  <button 
                    class="btn btn-outline-success w-100"
                    :class="{ active: travelOption === 'self' }"
                    @click="travelOption = 'self'"
                  >
                    <i class="fas fa-car me-2"></i>
                    Fahre selbst
                  </button>
                </div>
                <div class="col-md-4 mb-3">
                  <button 
                    class="btn btn-outline-primary w-100"
                    :class="{ active: travelOption === 'offer' }"
                    @click="travelOption = 'offer'"
                  >
                    <i class="fas fa-hand-holding-heart me-2"></i>
                    Biete Mitfahrt an
                  </button>
                </div>
                <div class="col-md-4 mb-3">
                  <button 
                    class="btn btn-outline-warning w-100"
                    :class="{ active: travelOption === 'request' }"
                    @click="travelOption = 'request'"
                  >
                    <i class="fas fa-hand-paper me-2"></i>
                    Suche Mitfahrt
                  </button>
                </div>
              </div>
              
              <!-- Ride Offer Form -->
              <div v-if="travelOption === 'offer'" class="mt-4">
                <RideOfferForm 
                  :event-code="event.unique_code"
                  :guest-token="$route.params.token"
                  :guest-info="guest"
                  @offer-created="handleOfferCreated"
                  @cancel="travelOption = null"
                />
              </div>
              
              <!-- Ride Request Form -->
              <div v-if="travelOption === 'request'" class="mt-4">
                <RideRequestForm 
                  :event-code="event.unique_code"
                  :guest-token="$route.params.token"
                  :guest-info="guest"
                  @request-created="handleRequestCreated"
                  @cancel="travelOption = null"
                />
              </div>
              
              <!-- Self Drive Info -->
              <div v-if="travelOption === 'self'" class="mt-4">
                <div class="alert alert-info">
                  <i class="fas fa-info-circle me-2"></i>
                  Sie fahren selbst zum Event. Falls Sie später doch eine Mitfahrgelegenheit anbieten oder suchen möchten, können Sie diese Option jederzeit ändern.
                </div>
              </div>
              
              <!-- My Rides Overview -->
              <div v-if="myRides && (myRides.offers.length > 0 || myRides.requests.length > 0)" class="mt-4">
                <h6>Meine Mitfahrgelegenheiten</h6>
                
                <!-- My Offers -->
                <div v-if="myRides.offers.length > 0" class="mb-3">
                  <h6 class="text-primary">Meine Angebote:</h6>
                  <div v-for="offer in myRides.offers" :key="offer.id" class="card mb-2">
                    <div class="card-body py-2">
                      <small>
                        <strong>{{ offer.departure_location }}</strong> um {{ formatDateTime(offer.departure_time) }}
                        - {{ offer.available_seats }} Plätze ({{ offer.remaining_seats }} frei)
                        <span class="badge bg-primary ms-2">{{ offer.status }}</span>
                      </small>
                    </div>
                  </div>
                </div>
                
                <!-- My Requests -->
                <div v-if="myRides.requests.length > 0">
                  <h6 class="text-warning">Meine Gesuche:</h6>
                  <div v-for="request in myRides.requests" :key="request.id" class="card mb-2">
                    <div class="card-body py-2">
                      <small>
                        <strong>{{ request.pickup_location }}</strong> - {{ request.passenger_count }} Person(en)
                        <span class="badge bg-warning ms-2">{{ request.status }}</span>
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="guest && guest.status !== 'pending'" class="card mt-4">
            <div class="card-header">
              <h5 class="mb-0">Ihre Beiträge</h5>
            </div>
            <div class="card-body">
              <div v-if="contributions.length === 0" class="text-muted mb-3">
                Sie haben noch keine Beiträge eingetragen.
              </div>
              <div v-else class="mb-3">
                <div v-for="contribution in contributions" :key="contribution.id" class="d-flex justify-content-between align-items-center mb-2">
                  <span>{{ contribution.item }} ({{ contribution.type }})</span>
                  <span class="text-muted">{{ contribution.quantity }}</span>
                </div>
              </div>
              
              <h6>Neuen Beitrag hinzufügen</h6>
              <div class="row">
                <div class="col-md-4">
                  <select class="form-select" v-model="newContribution.type">
                    <option value="">Typ wählen</option>
                    <option value="food">Speise</option>
                    <option value="drink">Getränk</option>
                    <option value="other">Sonstiges</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <input type="text" class="form-control" v-model="newContribution.item" placeholder="Was bringen Sie mit?">
                </div>
                <div class="col-md-2">
                  <input type="text" class="form-control" v-model="newContribution.quantity" placeholder="Menge">
                </div>
                <div class="col-md-2">
                  <button class="btn btn-success w-100" @click="addContribution" :disabled="!canAddContribution">
                    <i class="fas fa-plus"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="alert alert-danger mt-4">
            Gast oder Event nicht gefunden
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import apiService, { rideService } from '@/services/api'
import RideOfferForm from '@/components/RideOfferForm.vue'
import RideRequestForm from '@/components/RideRequestForm.vue'

export default {
  name: 'GuestInvitation',
  components: {
    RideOfferForm,
    RideRequestForm
  },
  data() {
    return {
      loading: true,
      guest: null,
      event: null,
      contributions: [],
      guestResponse: {
        status: '',
        children_count: 0,
        dietary_restrictions: '',
        special_notes: ''
      },
      newContribution: {
        type: '',
        item: '',
        quantity: ''
      },
      travelOption: null,
      myRides: null
    }
  },
  computed: {
    canAddContribution() {
      return this.newContribution.type && this.newContribution.item && this.guest && this.guest.status === 'accepted'
    }
  },
  async mounted() {
    await this.loadGuest()
    if (this.guest) {
      await this.loadContributions()
      if (this.guest.status === 'accepted') {
        await this.loadMyRides()
      }
    }
  },
  methods: {
    async loadGuest() {
      try {
        const data = await apiService.getGuest(this.$route.params.token)
        this.guest = data.guest
        this.event = data.event
        this.guestResponse = {
          status: this.guest.status,
          children_count: this.guest.children_count || 0,
          dietary_restrictions: this.guest.dietary_restrictions || '',
          special_notes: this.guest.special_notes || ''
        }
      } catch (error) {
        console.error('Error loading guest:', error)
      } finally {
        this.loading = false
      }
    },
    async loadContributions() {
      try {
        this.contributions = await apiService.getContributions(this.$route.params.token)
      } catch (error) {
        console.error('Error loading contributions:', error)
      }
    },
    async submitResponse() {
      try {
        await apiService.updateGuest(this.$route.params.token, this.guestResponse)
        this.guest.status = this.guestResponse.status
        alert('Ihre Antwort wurde gespeichert!')
        if (this.guestResponse.status === 'accepted') {
          await this.loadContributions()
        }
      } catch (error) {
        console.error('Error submitting response:', error)
        alert('Fehler beim Speichern der Antwort')
      }
    },
    async addContribution() {
      try {
        await apiService.addContribution(this.$route.params.token, this.newContribution)
        this.newContribution = { type: '', item: '', quantity: '' }
        await this.loadContributions()
        alert('Beitrag hinzugefügt!')
      } catch (error) {
        console.error('Error adding contribution:', error)
        alert('Fehler beim Hinzufügen des Beitrags')
      }
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleString('de-DE')
    },
    
    formatDateTime(dateString) {
      if (!dateString) return 'Nicht angegeben'
      
      const date = new Date(dateString)
      return date.toLocaleString('de-DE', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    async loadMyRides() {
      try {
        const response = await rideService.getGuestRides(this.$route.params.token)
        this.myRides = response.data
      } catch (error) {
        console.error('Error loading my rides:', error)
      }
    },
    
    async handleOfferCreated(offer) {
      this.travelOption = null
      await this.loadMyRides()
      alert('Mitfahrgelegenheit wurde erfolgreich erstellt!')
    },
    
    async handleRequestCreated(request) {
      this.travelOption = null
      await this.loadMyRides()
      alert('Mitfahrt-Gesuch wurde erfolgreich erstellt!')
    }
  }
}
</script>

<style scoped>
.btn.active {
  background-color: var(--bs-primary) !important;
  border-color: var(--bs-primary) !important;
  color: white !important;
}

.btn-outline-success.active {
  background-color: var(--bs-success) !important;
  border-color: var(--bs-success) !important;
}

.btn-outline-warning.active {
  background-color: var(--bs-warning) !important;
  border-color: var(--bs-warning) !important;
  color: #212529 !important;
}

.card {
  transition: all 0.2s ease-in-out;
}
</style>