import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Decision {
  id: string;
  decisionDescription?: string;
  title: string;
  category: string;
  importanceLevel?: 'Low' | 'Medium' | 'High' | 'Major';
  options: string;
  fears: string;
  hopes: string;
  gutFeeling: string;
  worstOutcome: string;
  worstOutcomeProbability?: number;
  recoveryPlan: string;
  chosenAction: string;
  confidenceRating: number;
  reviewDate?: number;
  date: number; // timestamp
  
  // Outcomes
  outcomeStatus: 'pending' | 'recorded';
  outcomeResult?: string;
  surprises?: string;
  lessonsLearned?: string;
  outcomeDate?: number;
  outcomeEvaluation?: 'Better than expected' | 'As expected' | 'Worse than expected';
  worstOutcomeOccurred?: boolean;
  longTermOutcomeReflection?: string;
}

interface ClarityDB extends DBSchema {
  decisions: {
    key: string;
    value: Decision;
    indexes: {
      'by-date': number;
      'by-status': string;
    };
  };
  settings: {
    key: string;
    value: any;
  };
}

let dbPromise: Promise<IDBPDatabase<ClarityDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ClarityDB>('clarity-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('decisions')) {
          const store = db.createObjectStore('decisions', { keyPath: 'id' });
          store.createIndex('by-date', 'date');
          store.createIndex('by-status', 'outcomeStatus');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

export const db = {
  async getAllDecisions(): Promise<Decision[]> {
    const db = await getDB();
    return db.getAllFromIndex('decisions', 'by-date');
  },
  
  async getDecision(id: string): Promise<Decision | undefined> {
    const db = await getDB();
    return db.get('decisions', id);
  },
  
  async saveDecision(decision: Decision): Promise<void> {
    const db = await getDB();
    await db.put('decisions', decision);
  },
  
  async deleteDecision(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('decisions', id);
  },
  
  async getSetting(key: string, defaultValue: any = null): Promise<any> {
    const db = await getDB();
    const value = await db.get('settings', key);
    return value !== undefined ? value : defaultValue;
  },
  
  async setSetting(key: string, value: any): Promise<void> {
    const db = await getDB();
    await db.put('settings', value, key);
  }
};
