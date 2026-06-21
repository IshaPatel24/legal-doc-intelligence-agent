// src/services/qdrant.ts
// Qdrant vector database service for semantic memory and retrieval

import { QdrantClient } from "@qdrant/js-client-rest";

interface ClauseVector {
  id: string;
  vector: number[];
  payload: {
    text: string;
    type: string;
    contractType: string;
    riskLevel: string;
    source?: string;
    jurisdiction?: string;
    year?: number;
  };
}

export class QdrantService {
  private client: QdrantClient;
  private collectionName = "legal_contracts";

  constructor(url: string, apiKey?: string) {
    this.client = new QdrantClient({
      url,
      apiKey,
    });
  }

  /**
   * Initialize Qdrant collection
   */
  async initializeCollection(): Promise<void> {
    try {
      await this.client.getCollection(this.collectionName);
      console.log(`[Qdrant] Collection '${this.collectionName}' already exists`);
    } catch (error) {
      console.log(
        `[Qdrant] Creating collection '${this.collectionName}'...`
      );
      await this.client.recreateCollection(this.collectionName, {
        vectors: {
          size: 384, // Claude embeddings dimension
          distance: "Cosine",
        },
      });
      console.log(`[Qdrant] Collection created successfully`);
    }
  }

  /**
   * Store clause vectors with metadata
   */
  async storeClauseVectors(clauses: ClauseVector[]): Promise<void> {
    try {
      await this.client.upsert(this.collectionName, {
        points: clauses.map((clause) => ({
          id: clause.id,
          vector: clause.vector,
          payload: clause.payload,
        })) as any,
      });
      console.log(`[Qdrant] Stored ${clauses.length} clause vectors`);
    } catch (error) {
      console.error("[Qdrant] Error storing vectors:", error);
      throw error;
    }
  }

  /**
   * Search for similar clauses
   */
  async searchSimilarClauses(
    vector: number[],
    clauseType: string,
    contractType: string,
    limit: number = 3
  ): Promise<ClauseVector[]> {
    try {
      const results = await this.client.search(this.collectionName, {
        vector,
        limit,
        filter: {
          must: [
            {
              key: "type",
              match: {
                value: clauseType,
              },
            },
            {
              key: "contractType",
              match: {
                value: contractType,
              },
            },
          ],
        },
      });

      return results.map((result: any) => ({
        id: result.id,
        vector: result.vector || [],
        payload: result.payload,
      }));
    } catch (error) {
      console.error("[Qdrant] Error searching similar clauses:", error);
      return [];
    }
  }

  /**
   * Search by text (requires embedding first)
   */
  async searchByEmbedding(
    embedding: number[],
    limit: number = 5,
    filter?: any
  ): Promise<any[]> {
    try {
      const results = await this.client.search(this.collectionName, {
        vector: embedding,
        limit,
        filter,
      });

      return results;
    } catch (error) {
      console.error("[Qdrant] Error searching by embedding:", error);
      return [];
    }
  }

  /**
   * Get all clauses of a specific type
   */
  async getClausesByType(clauseType: string): Promise<ClauseVector[]> {
    try {
      const results = await this.client.scroll(this.collectionName, {
        filter: {
          must: [
            {
              key: "type",
              match: {
                value: clauseType,
              },
            },
          ],
        },
        limit: 100,
      });

      return results.points.map((point: any) => ({
        id: point.id,
        vector: point.vector || [],
        payload: point.payload,
      }));
    } catch (error) {
      console.error("[Qdrant] Error fetching clauses by type:", error);
      return [];
    }
  }

  /**
   * Delete a specific clause vector
   */
  async deleteClause(clauseId: string): Promise<void> {
    try {
      await this.client.delete(this.collectionName, {
        points_selector: {
          points: [clauseId],
        },
      });
      console.log(`[Qdrant] Deleted clause ${clauseId}`);
    } catch (error) {
      console.error("[Qdrant] Error deleting clause:", error);
      throw error;
    }
  }

  /**
   * Get collection stats
   */
  async getCollectionStats(): Promise<any> {
    try {
      const info = await this.client.getCollection(this.collectionName);
      return {
        pointsCount: info.points_count,
        vectorsCount: info.vectors_count,
        status: info.status,
      };
    } catch (error) {
      console.error("[Qdrant] Error getting collection stats:", error);
      return null;
    }
  }
}

// Initialize Qdrant service
export const qdrantService = new QdrantService(
  process.env.QDRANT_URL || "http://localhost:6333",
  process.env.QDRANT_API_KEY
);
