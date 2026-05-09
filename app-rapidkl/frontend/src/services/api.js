import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

class RapidKLAPI {
  /**
   * Get operators
   */
  static async getOperators() {
    const response = await axios.get(`${API_URL}/operators`);
    return response.data.data;
  }

  /**
   * Get GTFS routes for operator
   */
  static async getGTFSRoutes(operator) {
    const response = await axios.get(`${API_URL}/gtfs/${operator}/routes`);
    return response.data.data;
  }

  /**
   * Get GTFS stops for operator
   */
  static async getGTFSStops(operator) {
    const response = await axios.get(`${API_URL}/gtfs/${operator}/stops`);
    return response.data.data;
  }

  /**
   * Get stops for a GTFS route
   */
  static async getRouteStops(operator, routeId) {
    const response = await axios.get(`${API_URL}/gtfs/${operator}/routes/${routeId}/stops`);
    return response.data.data;
  }

  /**
   * Get schedule for a stop
   */
  static async getSchedule(operator, routeId, stopId) {
    const response = await axios.get(`${API_URL}/gtfs/${operator}/routes/${routeId}/schedule`, {
      params: { stopId }
    });
    return response.data.data;
  }

  /**
   * Get all routes (RapidKL legacy)
   */
  static async getRoutes() {
    const response = await axios.get(`${API_URL}/routes`);
    return response.data.data;
  }

  /**
   * Get specific route (RapidKL legacy)
   */
  static async getRoute(routeId) {
    const response = await axios.get(`${API_URL}/routes/${routeId}`);
    return response.data.data;
  }

  /**
   * Search routes (RapidKL legacy)
   */
  static async searchRoutes(query) {
    const response = await axios.get(`${API_URL}/routes/search`, {
      params: { q: query }
    });
    return response.data.data;
  }

  /**
   * Get transits for a route (RapidKL legacy)
   */
  static async getTransits(routeId) {
    const response = await axios.get(`${API_URL}/transits/${routeId}`);
    return response.data.data;
  }

  /**
   * Get stop details (RapidKL legacy)
   */
  static async getStop(stopId) {
    const response = await axios.get(`${API_URL}/stops/${stopId}`);
    return response.data.data;
  }

  /**
   * Get arrivals at a stop (RapidKL legacy)
   */
  static async getArrivals(stopId) {
    const response = await axios.get(`${API_URL}/stops/${stopId}/arrivals`);
    return response.data.data;
  }

  /**
   * Get service status (RapidKL legacy)
   */
  static async getStatus() {
    const response = await axios.get(`${API_URL}/status`);
    return response.data.data;
  }

  /**
   * Clear cache (RapidKL legacy)
   */
  static async clearCache() {
    const response = await axios.post(`${API_URL}/cache/clear`);
    return response.data;
  }
}

export default RapidKLAPI;
