import axios from 'axios';

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

export const ipfs = {
  /**
   * Upload JSON metadata to IPFS via Pinata
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- metadata is user-supplied JSON
  async uploadMetadata(metadata: any): Promise<string> {
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
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': `multipart/form-data; boundary=${(formData as unknown as { _boundary: string })._boundary}`,
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
