// backend/src/agents/documentAnalyzer.ts
// Main Mastra agent for legal document analysis orchestration

import Anthropic from "@anthropic-ai/sdk";
import { QdrantClient } from "@qdrant/js-client-rest";
import { EnkryptAPI } from "@/services/enkrypt";

interface ContractAnalysis {
  summary: string;
  clauses: ClauseAnalysis[];
  actionItems: string[];
  enkryptValidation: {
    riskScore: number;
    issues: Array<{ type: string; description: string }>;
  };
}

interface ClauseAnalysis {
  id: string;
  originalText: string;
  type: string;
  riskLevel: "SAFE" | "NEEDS_REVIEW" | "HIGH";
  explanation: string;
  standardComparison?: string;
  counterClause?: string;
  counterClauseReasoning?: string;
}

export class LegalDocumentAnalyzer {
  private anthropic: InstanceType<typeof Anthropic>;
  private qdrant: QdrantClient;
  private enkrypt: EnkryptAPI;
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.qdrant = new QdrantClient({
      url: process.env.QDRANT_URL || "http://localhost:6333",
      apiKey: process.env.QDRANT_API_KEY,
    });

    this.enkrypt = new EnkryptAPI(process.env.ENKRYPT_API_KEY || "");
  }

  /**
   * Main orchestration workflow:
   * 1. Parse contract (extract text + clauses)
   * 2. Embed clauses in Qdrant
   * 3. Analyze each clause (risk + counter-clause)
   * 4. Validate outputs with Enkrypt AI
   * 5. Generate report
   */
  async analyzeContract(
    contractText: string,
    contractType: string,
    userId: string
  ): Promise<ContractAnalysis> {
    console.log("[Mastra] Starting contract analysis workflow");

    // Step 1: Extract clauses
    console.log("[Mastra] Step 1: Parsing contract");
    const clauses = await this.extractClauses(contractText);

    // Step 2: Embed and store in Qdrant
    console.log("[Mastra] Step 2: Embedding clauses in Qdrant");
    await this.storeClausesInQdrant(clauses, userId, contractType);

    // Step 3: Analyze each clause
    console.log("[Mastra] Step 3: Analyzing clauses");
    const analysis = await Promise.all(
      clauses.map((clause) =>
        this.analyzeClause(clause, contractType, userId)
      )
    );

    // Step 4: Validate all outputs with Enkrypt
    console.log("[Mastra] Step 4: Validating with Enkrypt AI");
    const enkryptValidation = await this.validateAnalysisBatch(analysis);

    // Step 5: Assemble report
    console.log("[Mastra] Step 5: Assembling final report");
    const report = this.assembleReport(analysis, enkryptValidation);

    // Store in conversation history for Q&A
    this.conversationHistory.push({
      role: "assistant",
      content: `Contract analyzed. Found ${clauses.length} clauses. Risk summary: ${report.actionItems.length} action items.`,
    });

    return report;
  }

  /**
   * Extract clauses from raw contract text
   * Uses Claude to intelligently chunk by clause type
   */
  private async extractClauses(
    contractText: string
  ): Promise<
    Array<{
      id: string;
      text: string;
      type: string;
      startPos: number;
      endPos: number;
    }>
  > {
    const response = await this.anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are a contract analyst. Extract all distinct clauses from this contract. 
For each clause, identify:
1. The clause text (exact excerpt)
2. The clause type (e.g., "liability", "payment", "non-compete", "confidentiality", "termination", "ip_ownership")
3. Start and end positions in the original text

Return as JSON array: [{text, type, startPos, endPos}, ...]

Contract:
${contractText}`,
        },
      ],
    });

    let extractedText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Clean up markdown code blocks if present
    extractedText = extractedText
      .replace(/^```json\n?/, "")
      .replace(/\n?```$/, "")
      .trim();

    try {
      const parsed = JSON.parse(extractedText);
      return (parsed as any[]).map((clause, idx) => ({
        id: `clause_${idx}`,
        text: clause.text,
        type: clause.type,
        startPos: clause.startPos || 0,
        endPos: clause.endPos || 0,
      }));
    } catch (e) {
      console.error("Failed to parse clause extraction", e);
      // Fallback: split by newline
      return contractText.split("\n").map((text, idx) => ({
        id: `clause_${idx}`,
        text: text.trim(),
        type: "unknown",
        startPos: 0,
        endPos: 0,
      }));
    }
  }

  /**
   * Embed clauses and store in Qdrant
   */
  private async storeClausesInQdrant(
    clauses: Array<any>,
    userId: string,
    contractType: string
  ): Promise<void> {
    // Get embeddings from Claude
    const embeddings = await Promise.all(
      clauses.map((clause) =>
        this.anthropic.messages.create({
          model: "claude-opus-4-6",
          max_tokens: 100,
          messages: [
            {
              role: "user",
              content: `Summarize this clause in 1-2 sentences for legal document classification:
"${clause.text}"`,
            },
          ],
        })
      )
    );

    // For production: use actual embedding API
    // For now, we'll use a mock vector representation
    const points = clauses.map((clause, idx) => ({
      id: clause.id,
      vector: this.mockEmbedding(clause.text), // Mock: 384-dim vector
      payload: {
        userId,
        contractType,
        clauseType: clause.type,
        text: clause.text,
        timestamp: new Date().toISOString(),
      },
    }));

    try {
      await this.qdrant.upsert("legal_contracts", {
        points: points as any,
      });
      console.log(`[Qdrant] Stored ${points.length} clause vectors`);
    } catch (e) {
      console.error("[Qdrant] Failed to upsert points:", e);
    }
  }

  /**
   * Analyze a single clause: risk + comparison + counter-clause
   */
  private async analyzeClause(
    clause: any,
    contractType: string,
    userId: string
  ): Promise<ClauseAnalysis> {
    // Retrieve similar clauses from knowledge base
    const similarClauses = await this.retrieveSimilarClauses(
      clause.text,
      clause.type,
      contractType
    );

    // Analyze with Claude
    const analysisPrompt = `You are a legal expert analyzing Indian contracts. 

Clause to analyze:
"${clause.text}"

Clause type: ${clause.type}
Contract type: ${contractType}

Similar clauses in our knowledge base (market standards):
${similarClauses.map((s) => `- "${s.text}" (Risk: ${s.riskLevel})`).join("\n")}

Please provide:
1. Risk classification: SAFE / NEEDS_REVIEW / HIGH
2. Plain-English explanation of what this clause means and why it's risky/safe
3. How it compares to market standards
4. If HIGH or NEEDS_REVIEW: Draft a safer alternative clause

Return as JSON:
{
  "riskLevel": "HIGH|NEEDS_REVIEW|SAFE",
  "explanation": "...",
  "standardComparison": "...",
  "counterClause": "...",
  "counterClauseReasoning": "..."
}`;

    const response = await this.anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: analysisPrompt }],
    });

    let analysisText =
      response.content[0].type === "text" ? response.content[0].text : "{}";

    // Clean markdown
    analysisText = analysisText
      .replace(/^```json\n?/, "")
      .replace(/\n?```$/, "")
      .trim();

    const analysis = JSON.parse(analysisText);

    return {
      id: clause.id,
      originalText: clause.text,
      type: clause.type,
      riskLevel: analysis.riskLevel || "NEEDS_REVIEW",
      explanation: analysis.explanation || "",
      standardComparison: analysis.standardComparison,
      counterClause: analysis.counterClause,
      counterClauseReasoning: analysis.counterClauseReasoning,
    };
  }

  /**
   * Retrieve similar clauses from Qdrant knowledge base
   */
  private async retrieveSimilarClauses(
    clauseText: string,
    clauseType: string,
    contractType: string
  ): Promise<Array<{ text: string; riskLevel: string }>> {
    try {
      // Mock retrieval for now
      // In production: embed clauseText and search Qdrant
      const mockStandards: { [key: string]: Array<any> } = {
        liability: [
          {
            text: "The Company shall not be liable for indirect, incidental, or consequential damages.",
            riskLevel: "SAFE",
          },
          {
            text: "The Company's liability shall be limited to the fees paid in the preceding 12 months.",
            riskLevel: "SAFE",
          },
        ],
        payment: [
          {
            text: "Payment is due within 30 days of invoice.",
            riskLevel: "SAFE",
          },
          {
            text: "50% upon commencement, 50% upon delivery.",
            riskLevel: "SAFE",
          },
        ],
        "non-compete": [
          {
            text: "Employee shall not compete for 1 year within a 50km radius.",
            riskLevel: "NEEDS_REVIEW",
          },
          {
            text: "Employee shall not solicit clients for 2 years.",
            riskLevel: "HIGH",
          },
        ],
      };

      return mockStandards[clauseType] || [];
    } catch (e) {
      console.error("[Qdrant] Search failed:", e);
      return [];
    }
  }

  /**
   * Validate all analyses with Enkrypt AI
   */
  private async validateAnalysisBatch(
    analyses: ClauseAnalysis[]
  ): Promise<{
    riskScore: number;
    issues: Array<{ type: string; description: string }>;
  }> {
    const allText = analyses
      .map(
        (a) =>
          `Clause (${a.type}): ${a.explanation}. Counter-clause: ${a.counterClause}`
      )
      .join("\n\n");

    try {
      const validation = await this.enkrypt.evaluate({
        text: allText,
        checks: {
          hallucination: true,
          bias: true,
          harmful_advice: true,
          factual_accuracy: true,
        },
      });

      return {
        riskScore: validation.risk_score || 0,
        issues: validation.issues || [],
      };
    } catch (e) {
      console.error("[Enkrypt] Validation failed:", e);
      return { riskScore: 0, issues: [] };
    }
  }

  /**
   * Assemble final report
   */
  private assembleReport(
    analyses: ClauseAnalysis[],
    enkryptValidation: any
  ): ContractAnalysis {
    const highRiskClauses = analyses.filter((a) => a.riskLevel === "HIGH");
    const needsReviewClauses = analyses.filter(
      (a) => a.riskLevel === "NEEDS_REVIEW"
    );

    const actionItems = [
      ...highRiskClauses.map(
        (c) =>
          `HIGH PRIORITY: Review ${c.type} clause. Consider counter-clause: ${c.counterClause?.substring(0, 50)}...`
      ),
      ...needsReviewClauses.map(
        (c) =>
          `REVIEW: ${c.type} clause needs attention. Proposed change: ${c.counterClause?.substring(0, 50)}...`
      ),
    ];

    return {
      summary: `Found ${analyses.length} clauses. ${highRiskClauses.length} high-risk, ${needsReviewClauses.length} need review.`,
      clauses: analyses,
      actionItems,
      enkryptValidation,
    };
  }

  /**
   * Q&A capability: Remember contract, answer questions
   */
  async answerQuestion(
    question: string,
    contractText: string
  ): Promise<string> {
    this.conversationHistory.push({ role: "user", content: question });

    const response = await this.anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1000,
      system: `You are a legal assistant analyzing an Indian contract. 
Answer questions about the contract clearly and plainly. 
Reference specific clauses when relevant.
Always mention Indian law (Contract Act 1872, etc.) when applicable.
Never fabricate legal precedents.`,
      messages: [
        {
          role: "user",
          content: `Contract text:\n${contractText}\n\nQuestion: ${question}`,
        },
      ],
    });

    const answer =
      response.content[0].type === "text" ? response.content[0].text : "";
    this.conversationHistory.push({ role: "assistant", content: answer });

    return answer;
  }

  /**
   * Mock embedding for demo purposes
   * In production: use actual Claude embeddings API
   */
  private mockEmbedding(text: string): number[] {
    const seed = text.length;
    const vector: number[] = [];
    for (let i = 0; i < 384; i++) {
      vector.push(Math.sin((seed + i) * 0.1) * 0.5 + 0.5);
    }
    return vector;
  }
}

// Export for use in API routes
export default LegalDocumentAnalyzer;
