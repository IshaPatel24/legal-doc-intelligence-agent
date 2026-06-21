// backend/src/api/analyze.ts
// POST /api/analyze - Main entry point for contract analysis

import { NextRequest, NextResponse } from "next/server";
import LegalDocumentAnalyzer from "@/agents/documentAnalyzer";
import { extractTextFromPDF } from "@/services/pdfParser";

interface AnalyzeRequest {
  file?: File;
  text?: string;
  contractType?: string;
}

interface AnalyzeResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Parse multipart form data or JSON
    const contentType = req.headers.get("content-type") || "";

    let contractText = "";
    let contractType = "general";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      contractType = (formData.get("contractType") as string) || "general";

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No file provided" },
          { status: 400 }
        );
      }

      // Extract text from PDF or plain text
      if (file.type === "application/pdf") {
        contractText = await extractTextFromPDF(file);
      } else {
        contractText = await file.text();
      }
    } else {
      // Assume JSON body
      const body = await req.json();
      contractText = body.text;
      contractType = body.contractType || "general";

      if (!contractText) {
        return NextResponse.json(
          {
            success: false,
            error: "No contract text provided",
          },
          { status: 400 }
        );
      }
    }

    console.log(`[API] Received contract analysis request`);
    console.log(`[API] Contract type: ${contractType}`);
    console.log(`[API] Text length: ${contractText.length} chars`);

    // Initialize analyzer
    const analyzer = new LegalDocumentAnalyzer();
    const userId = req.headers.get("x-user-id") || "anonymous";

    // Run analysis workflow
    console.log(`[API] Starting analysis workflow`);
    const startTime = Date.now();

    const analysis = await analyzer.analyzeContract(
      contractText,
      contractType,
      userId
    );

    const duration = Date.now() - startTime;
    console.log(`[API] Analysis complete in ${duration}ms`);

    // Format response
    const response: AnalyzeResponse = {
      success: true,
      data: {
        summary: analysis.summary,
        clauses: analysis.clauses.map((c) => ({
          id: c.id,
          type: c.type,
          riskLevel: c.riskLevel,
          originalText: c.originalText,
          explanation: c.explanation,
          standardComparison: c.standardComparison,
          counterClause: c.counterClause,
          counterClauseReasoning: c.counterClauseReasoning,
        })),
        actionItems: analysis.actionItems,
        enkryptValidation: analysis.enkryptValidation,
        processingTime: duration,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] Error during analysis:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: `Analysis failed: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

// GET /api/analyze - Health check
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    message: "Legal Document Intelligence Agent API is running",
    version: "1.0.0",
    features: [
      "Contract analysis",
      "Clause extraction",
      "Risk classification",
      "Counter-clause generation",
      "Q&A support",
    ],
  });
}
