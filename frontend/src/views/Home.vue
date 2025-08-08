<template>
  <div class="home">
    <div class="hero-section bg-primary text-white py-5 mb-5 rounded">
      <div class="container text-center">
        <h1 class="display-4 mb-4">
          <i class="fas fa-birthday-cake me-3"></i>
          Willkommen zur Feierplanungsapp
        </h1>
        <p class="lead mb-4">
          Organisieren Sie Ihre Events und Feiern professionell und einfach. 
          Versenden Sie Einladungen, verwalten Sie Gäste und koordinieren Sie Beiträge.
        </p>
        <div class="d-flex justify-content-center gap-3">
          <router-link to="/create" class="btn btn-light btn-lg">
            <i class="fas fa-plus me-2"></i>
            Event erstellen
          </router-link>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-6 mb-4">
        <div class="card h-100">
          <div class="card-body text-center">
            <i class="fas fa-calendar-plus fa-3x text-primary mb-3"></i>
            <h5 class="card-title">Event erstellen</h5>
            <p class="card-text">
              Erstellen Sie ein neues Event mit allen wichtigen Details wie Datum, 
              Uhrzeit und Ort. Generieren Sie automatisch einen eindeutigen Link.
            </p>
            <router-link to="/create" class="btn btn-primary">
              Jetzt erstellen
            </router-link>
          </div>
        </div>
      </div>

      <div class="col-md-6 mb-4">
        <div class="card h-100">
          <div class="card-body text-center">
            <i class="fas fa-link fa-3x text-success mb-3"></i>
            <h5 class="card-title">Event verwalten</h5>
            <p class="card-text">
              Sie haben bereits ein Event erstellt? Geben Sie Ihren Event-Code ein, 
              um Ihr Event zu verwalten und Einladungen zu versenden.
            </p>
            <div class="input-group mb-3">
              <input 
                type="text" 
                class="form-control" 
                placeholder="Event-Code eingeben"
                v-model="eventCode"
                @keyup.enter="goToEvent"
              >
              <button 
                class="btn btn-success" 
                type="button"
                @click="goToEvent"
                :disabled="!eventCode.trim()"
              >
                Öffnen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row mt-5">
      <div class="col-12">
        <h2 class="text-center mb-4">Features</h2>
      </div>
      
      <div class="col-md-4 mb-4">
        <div class="card text-center">
          <div class="card-body">
            <i class="fas fa-users fa-2x text-info mb-3"></i>
            <h6 class="card-title">Gästeverwaltung</h6>
            <p class="card-text small">
              Überblick über Zu- und Absagen, Kinderanzahl und besondere Hinweise
            </p>
          </div>
        </div>
      </div>
      
      <div class="col-md-4 mb-4">
        <div class="card text-center">
          <div class="card-body">
            <i class="fas fa-utensils fa-2x text-warning mb-3"></i>
            <h6 class="card-title">Speisen & Getränke</h6>
            <p class="card-text small">
              Koordination wer was mitbringt, inklusive Unverträglichkeiten
            </p>
          </div>
        </div>
      </div>
      
      <div class="col-md-4 mb-4">
        <div class="card text-center">
          <div class="card-body">
            <i class="fas fa-envelope fa-2x text-danger mb-3"></i>
            <h6 class="card-title">Einladungslinks</h6>
            <p class="card-text small">
              Personalisierte Links für jeden Gast mit einfacher Verwaltung
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data() {
    return {
      eventCode: ''
    }
  },
  methods: {
    goToEvent() {
      if (this.eventCode.trim()) {
        this.$router.push(`/event/${this.eventCode.trim()}`)
      }
    }
  }
}
</script>

<style scoped>
.hero-section {
  background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%);
}

.card {
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-5px);
}

.fa-3x {
  font-size: 3rem;
}

.fa-2x {
  font-size: 2rem;
}
</style>