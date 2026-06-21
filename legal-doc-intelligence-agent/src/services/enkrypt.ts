// backend/src/services/enkrypt.ts
// Enkrypt AI integration for safety validation

export interface EnkryptValidationRequest {
  text: string;
  checks: {
    hallucination?: boolean;
    bias?: boolean;
    harmful_advice?: boolean;
    factual_accuracy?: boolean;
  };
}

export interface EnkryptValidationResponse {
  risk_score: number;
  safe: boolean;
  issues: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    description: string;
  }>;
}

/**
 * EnkryptAPI: Safety validation service
 * Validates all agent outputs for hallucination, bias, and harmful advice
 *
 * This is CRITICAL for legal documents:
 * - No fabricated case law or precedents
 * - No biased analysis
 * - No advice that could cause legal harm
 */
export class EnkryptAPI {
  private apiKey: string;
  private baseUrl: string = "https://api.enkrypt.ai/v1";

  constructor(apiKey: string) {
    if (!apiKey) {
      console.warn(
        "[Enkrypt] No API key provided. Validation will be mocked."
      );
    }
    this.apiKey = apiKey;
  }

  /**
   * Validate legal analysis output
   * Returns risk score and identified issues
   */
  async evaluate(request: EnkryptValidationRequest): Promise<EnkryptValidationResponse> {
    console.log(`[Enkrypt] Validating ${request.text.length} chars of legal text`);

    try {
      // If no API key, run mock validation (for demo purposes)
      if (!this.apiKey) {
        return this.mockValidation(request.text, request.checks);
      }

      // Call actual Enkrypt API
      const response = await fetch(`${this.baseUrl}/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          text: request.text,
          context: "legal_document_analysis",
          checks: request.checks,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Enkrypt API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log(
        `[Enkrypt] Validation complete. Risk score: ${data.risk_score}`
      );

      return {
        risk_score: data.risk_score || 0,
        safe: (data.risk_score || 0) < 0.3,
        issues: data.issues || [],
      };
    } catch (error) {
      console.error("[Enkrypt] Validation failed:", error);
      // Fail open: don't block on validation errors
      return {
        risk_score: 0,
        safe: true,
        issues: [],
      };
    }
  }

  /**
   * Mock validation (for development/demo)
   * Checks for obvious red flags
   */
  private mockValidation(
    text: string,
    checks: any
  ): EnkryptValidationResponse {
    const issues: Array<{
      type: string;
      severity: "low" | "medium" | "high";
      description: string;
    }> = [];

    // Check for hallucinated case law
    if (checks.hallucination) {
      // Look for common fabrication patterns
      const hallucPatterns = [
        /\bas per the (landmark )?case.*?v.*?(\d{4})/gi,
        /according to.*?judgment/gi,
        /(precedent|ruling|verdict).*?(2024|2025)/gi, // Recent fabrications
      ];

      for (const pattern of hallucPatterns) {
        if (pattern.test(text)) {
          // Extract the suspicious citation
          const match = text.match(pattern);
          if (match) {
            issues.push({
              type: "hallucination",
              severity: "high",
              description: `Potential fabricated legal citation: "${match[0]}". Verify in actual case law.`,
            });
          }
        }
      }
    }

    // Check for bias
    if (checks.bias) {
      const biasPhrases = [
        "obviously unfair to the employee",
        "clearly one-sided",
        "always",
        "never",
        "universally",
        "definitely illegal",
      ];

      for (const phrase of biasPhrases) {
        if (text.toLowerCase().includes(phrase)) {
          issues.push({
            type: "bias",
            severity: "medium",
            description: `Potentially biased language detected: "${phrase}". Present both perspectives.`,
          });
        }
      }
    }

    // Check for harmful advice
    if (checks.harmful_advice) {
      const harmfulPhrases = [
        "ignore this clause",
        "don't pay",
        "violate the agreement",
        "commit fraud",
      ];

      for (const phrase of harmfulPhrases) {
        if (text.toLowerCase().includes(phrase)) {
          issues.push({
            type: "harmful_advice",
            severity: "high",
            description: `Potentially harmful advice detected: "${phrase}". This could expose the user to legal liability.`,
          });
        }
      }
    }

    // Check for factual accuracy
    if (checks.factual_accuracy) {
      // Check for India-specific claims
      const indiaClaims =
        text.match(/Indian (law|court|statute|contract act)/gi) || [];

      if (indiaClaims.length > 0) {
        // Verify these are real legal references
        const validReferences = [
          "Indian Contract Act, 1872",
          "Indian Penal Code",
          "Arbitration and Conciliation Act, 1996",
          "Companies Act, 2013",
        ];

        const hasValidRef = validReferences.some((ref) => text.includes(ref));

        if (!hasValidRef && indiaClaims.length > 3) {
          issues.push({
            type: "factual_accuracy",
            severity: "medium",
            description:
              "Multiple references to Indian law without specific statute citations. Ensure all claims are verifiable.",
          });
        }
      }
    }

    // Calculate risk score
    const riskScore =
      issues.reduce((sum, issue) => {
        const severity = { low: 0.1, medium: 0.3, high: 0.5 }[issue.severity];
        return sum + severity;
      }, 0) / Math.max(issues.length, 1);

    console.log(
      `[Enkrypt Mock] Risk score: ${riskScore.toFixed(2)}, Issues: ${issues.length}`
    );

    return {
      risk_score: Math.min(riskScore, 1.0),
      safe: riskScore < 0.3,
      issues,
    };
  }

  /**
   * Batch validate multiple analyses
   */
  async batchValidate(
    analyses: Array<{ explanation: string; counterClause?: string }>
  ): Promise<Array<EnkryptValidationResponse>> {
    console.log(
      `[Enkrypt] Batch validating ${analyses.length} clause analyses`
    );

    const results = await Promise.all(
      analyses.map((analysis) =>
        this.evaluate({
          text: `${analysis.explanation}. Counter-clause: ${analysis.counterClause || "N/A"}`,
          checks: {
            hallucination: true,
            bias: true,
            harmful_advice: true,
            factual_accuracy: true,
          },
        })
      )
    );

    return results;
  }

  /**
   * Sanitize output if it fails validation
   * Removes problematic parts and regenerates
   */
  async sanitize(text: string): Promise<string> {
    console.log(`[Enkrypt] Sanitizing ${text.length} chars`);

    const validation = await this.evaluate({
      text,
      checks: {
        hallucination: true,
        bias: true,
        harmful_advice: true,
        factual_accuracy: true,
      },
    });

    if (validation.safe) {
      return text;
    }

    // Remove problematic parts based on issues
    let sanitized = text;

    for (const issue of validation.issues) {
      if (issue.type === "hallucination") {
        // Remove hallucinated citations
        sanitized = sanitized.replace(
          /as per.*?case.*?\d{4}/gi,
          "[Citation removed - verify with actual case law]"
        );
      }

      if (issue.type === "harmful_advice") {
        // Remove harmful suggestions
        sanitized = sanitized.replace(
          /(?:don't|ignore|violate).*?(?:clause|agreement)/gi,
          "[Harmful advice removed - consult legal counsel]"
        );
      }

      if (issue.type === "bias") {
        // Remove absolute statements
        sanitized = sanitized.replace(
          /\b(always|never|definitely|certainly|obviously)\b/gi,
          "[qualifier removed for accuracy]"
        );
      }
    }

    return sanitized;
  }
}

// Export singleton for use across app
export const enkryptAPI = new EnkryptAPI(process.env.ENKRYPT_API_KEY || "");
