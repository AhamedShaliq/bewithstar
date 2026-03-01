import { API_BASE_URL } from './apiConfig';

export const cleanImageUrl = (url: string): string => {
    if (!url) return '';
    // Replace hardcoded localhost from legacy DB entries with the dynamic API base URL
    return url.replace('http://localhost:5000', API_BASE_URL);
};

export const getPrimaryImage = (imageUrl: string): string => {
    try {
        const arr = JSON.parse(imageUrl);
        const url = Array.isArray(arr) && arr.length > 0 ? arr[0] : imageUrl;
        return cleanImageUrl(url);
    } catch {
        return cleanImageUrl(imageUrl);
    }
};

export const getAllImages = (imageUrl: string): string[] => {
    try {
        const arr = JSON.parse(imageUrl);
        const urls = Array.isArray(arr) ? arr : [imageUrl];
        return urls.map(cleanImageUrl);
    } catch {
        return imageUrl ? [cleanImageUrl(imageUrl)] : [];
    }
};
