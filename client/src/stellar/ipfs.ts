import axios from 'axios';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;

export const ipfs = {
  /**
   * Upload JSON metadata to IPFS via Pinata
   */
  async uploadMetadata(metadata: Record<string, unknown>): Promise<string> {
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      throw new Error('Pinata API keys not configured');
    }

    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        metadata,
        {
          headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_KEY,
          },
        }
      );
      return response.data.IpfsHash;
    } catch (e) {
      console.error('Failed to upload to IPFS:', e);
      throw e;
    }
  },

  /**
   * Upload a file to IPFS via Pinata
   */
  async uploadFile(file: File): Promise<string> {
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      throw new Error('Pinata API keys not configured');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Let axios set the multipart Content-Type boundary automatically
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_KEY,
          },
        }
      );
      return response.data.IpfsHash;
    } catch (e) {
      console.error('Failed to upload file to IPFS:', e);
      throw e;
    }
  },

  /**
   * Get the IPFS URL for a CID
   */
  getIpfsUrl(cid: string): string {
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  },
};
