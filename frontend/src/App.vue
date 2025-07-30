<template>
  <div id="app">
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container">
        <router-link class="navbar-brand" to="/">
          <i class="fas fa-party-horn me-2"></i>
          Feierplanungsapp
        </router-link>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <router-link class="nav-link" to="/">Home</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/create">Event erstellen</router-link>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <main class="container mt-4">
      <router-view/>
    </main>

    <footer class="bg-light text-center py-4 mt-5">
      <div class="container">
        <p class="mb-0 text-muted">
          &copy; 2024 Feierplanungsapp - Ihre Events professionell organisiert
        </p>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}

.btn-primary {
  background-color: #6f42c1;
  border-color: #6f42c1;
}

.btn-primary:hover {
  background-color: #5a32a3;
  border-color: #5a32a3;
}

.navbar-dark .navbar-brand {
  font-weight: 600;
  font-size: 1.5rem;
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.badge {
  font-size: 0.75em;
}
</style>