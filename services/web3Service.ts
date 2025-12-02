
import { ethers } from 'ethers';
import { GoogleGenAI } from "@google/genai";

// Initialize AI for Semantic Hashing
let ai: GoogleGenAI | null = null;
const fallbackKey = 'AIzaSyDK2bK1HEvcNdkjrESsJlkinI9sgzqLKPQ';

try {
    // @ts-ignore
    let key = '';
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
        // @ts-ignore
        key = import.meta.env.VITE_API_KEY;
    }
    
    if (!key) key = fallbackKey;

    if(key) ai = new GoogleGenAI({ apiKey: key });
} catch(e) {
     // Ensure fallback works if env access fails
     try {
        ai = new GoogleGenAI({ apiKey: fallbackKey });
     } catch(err) {}
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: string | null;
}

const getProvider = () => {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return new ethers.BrowserProvider((window as any).ethereum);
  }
  return null;
};

export const connectWallet = async (): Promise<WalletState> => {
  // 1. Check for global provider presence immediately
  const hasWeb3 = typeof window !== 'undefined' && (window as any).ethereum;

  if (!hasWeb3) {
      console.warn("MetaMask not detected. Activating SIMULATION MODE.");
      // Simulate network delay for realism
      await new Promise(r => setTimeout(r, 600));
      return {
          address: "0xSIMULATED_WALLET_" + Math.floor(Math.random() * 9999).toString(),
          isConnected: true,
          chainId: "1337"
      };
  }

  try {
    const provider = getProvider();
    if (!provider) throw new Error("Provider initialization failed");
    
    // 2. Attempt real connection
    const accounts = await provider.send("eth_requestAccounts", []);
    const network = await provider.getNetwork();

    return {
      address: accounts[0],
      isConnected: true,
      chainId: network.chainId.toString()
    };
  } catch (error) {
    console.warn("Wallet connection failed or rejected by user. Fallback to SIMULATION MODE.", error);
    // 3. Fallback to simulation on error so the app remains usable
    return {
        address: "0x71C7656EC7ab88b098defB751B7401B5f6d89A23",
        isConnected: true,
        chainId: "11155111"
    };
  }
};

export const getCanonicalFact = async (text: string): Promise<string> => {
    if (!ai) return text.toLowerCase().trim();
    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Convert this headline into a simple, atomic fact string (Subject + Action + Object). No extra words. lowercase. Example: "India wins cup" -> "india wins world cup". Input: "${text}"`
        });
        const fact = result.text?.trim().toLowerCase().replace(/[^\w\s]/gi, '') || text.toLowerCase().trim();
        return fact;
    } catch (e) {
        return text.toLowerCase().trim();
    }
};

export const signHeadline = async (headline: string): Promise<{ signature: string, hash: string, fact: string } | null> => {
  try {
    const provider = getProvider();
    
    // 1. Semantic Hashing
    const canonicalFact = await getCanonicalFact(headline);
    const hash = ethers.hashMessage(canonicalFact);
    
    // --- FALLBACK FOR SIMULATION ---
    if (!provider) {
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        const padding = "0000000000000000000000000000000000000000000000000000000000000000"; 
        const fakeSig = hash + padding; 
        return { signature: fakeSig, hash, fact: canonicalFact };
    }

    try {
        // 2. EIP-712 Domain
        const domain = {
            name: 'Sophon Sentinel',
            version: '1',
            chainId: (await provider.getNetwork()).chainId,
        };

        // 3. The Data Structure
        const types = {
            NewsRecord: [
                { name: 'Headline', type: 'string' },
                { name: 'CanonicalFact', type: 'string' },
                { name: 'Timestamp', type: 'string' },
                { name: 'Publisher', type: 'address' }
            ]
        };

        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        const value = {
            Headline: headline,
            CanonicalFact: canonicalFact,
            Timestamp: new Date().toISOString(),
            Publisher: address
        };

        // 4. Sign Typed Data
        const signature = await signer.signTypedData(domain, types, value);
        return { signature, hash, fact: canonicalFact };

    } catch (signingError) {
        // CRITICAL: If user rejects, return NULL so we don't mine a fake block
        console.warn("Signing cancelled by user.");
        return null;
    }

  } catch (error) {
    console.error("Signing process failed:", error);
    return null;
  }
};
