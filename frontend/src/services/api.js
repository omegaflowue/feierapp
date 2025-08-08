import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? '/backend/web' 
    : 'http://localhost:8081',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
})

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export const eventService = {
  create(eventData) {
    return api.post('/events', eventData)
  },
  
  get(code) {
    return api.get(`/events/${code}`)
  },
  
  update(code, eventData) {
    return api.put(`/events/${code}`, eventData)
  },
  
  delete(code) {
    return api.delete(`/events/${code}`)
  },
  
  getGuests(code) {
    return api.get(`/events/${code}/guests`)
  },
  
  addGuest(code, guestData) {
    return api.post(`/events/${code}/guests`, guestData)
  }
}

export const guestService = {
  get(token) {
    return api.get(`/guests/${token}`)
  },
  
  update(token, guestData) {
    return api.put(`/guests/${token}`, guestData)
  },
  
  getContributions(token) {
    return api.get(`/guests/${token}/contributions`)
  },
  
  addContribution(token, contributionData) {
    return api.post(`/guests/${token}/contributions`, contributionData)
  }
}

export const contributionService = {
  update(id, contributionData) {
    return api.put(`/contributions/${id}`, contributionData)
  },
  
  delete(id) {
    return api.delete(`/contributions/${id}`)
  }
}

export const rideService = {
  // Get all rides for an event
  getRides(eventCode) {
    return api.get(`/events/${eventCode}/rides`)
  },
  
  // Create ride offer
  createOffer(eventCode, offerData) {
    return api.post(`/events/${eventCode}/ride-offers`, offerData)
  },
  
  // Create ride request
  createRequest(eventCode, requestData) {
    return api.post(`/events/${eventCode}/ride-requests`, requestData)
  },
  
  // Get rides for specific guest
  getGuestRides(guestToken) {
    return api.get(`/guests/${guestToken}/rides`)
  },
  
  // Update ride offer
  updateOffer(offerId, offerData) {
    return api.put(`/ride-offers/${offerId}`, offerData)
  },
  
  // Update ride request
  updateRequest(requestId, requestData) {
    return api.put(`/ride-requests/${requestId}`, requestData)
  },
  
  // Create ride match
  createMatch(matchData) {
    return api.post('/ride-matches', matchData)
  },
  
  // Confirm ride match
  confirmMatch(matchId, confirmData) {
    return api.put(`/ride-matches/${matchId}/confirm`, confirmData)
  },
  
  // Decline ride match
  declineMatch(matchId, declineData) {
    return api.put(`/ride-matches/${matchId}/decline`, declineData)
  }
}

export default api