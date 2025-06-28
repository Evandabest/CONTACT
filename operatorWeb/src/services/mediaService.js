class MediaService {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  async getMediaList(type) {
    try {
      const response = await fetch(`${this.baseUrl}/api/media/${type}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error(`Error fetching ${type} list:`, error);
      return [];
    }
  }

  async getPhotos() {
    return this.getMediaList('photos');
  }

  async getVideos() {
    return this.getMediaList('videos');
  }

  getMediaUrl(type, filename) {
    return `${this.baseUrl}/media/${type}/${filename}`;
  }

  getPhotoUrl(filename) {
    return this.getMediaUrl('photos', filename);
  }

  getVideoUrl(filename) {
    return this.getMediaUrl('videos', filename);
  }

  async checkServerHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.status === 'OK';
    } catch (error) {
      console.error('Server health check failed:', error);
      return false;
    }
  }
}

// Create a singleton instance
const mediaService = new MediaService();
export default mediaService; 