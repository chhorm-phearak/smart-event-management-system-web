import api from './api';

/**
 * Upload a single file to the server.
 * Do not set Content-Type so axios sets multipart/form-data with boundary.
 * @param {File} file - The file to upload
 * @returns {Promise<{ data: { file: { file_url: string, ... } } }>} Upload response with file_url
 */
export const uploadSingle = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload/single', formData);
  return response.data;
};
