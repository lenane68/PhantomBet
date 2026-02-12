/**
 * AI Analysis using OpenAI GPT-4 for PhantomBet CRE Workflow using official SDK
 */

import {
    HTTPClient,
    type Runtime,
    consensusIdenticalAggregation,
    Value,
} from "@chainlink/cre-sdk";
import type { DataSource, AIAnalysisResult } from "./types.js";

export class AIAnalyzer {
    private httpClient: HTTPClient;

    constructor() {
        this.httpClient = new HTTPClient();
    }

    /**
     * Analyze market outcome using GPT-4 with DON consensus
     */
    async analyzeOutcome(
        runtime: Runtime<any>,
        question: string,
        outcomes: string[],
        dataSources: DataSource[],
        apiKey: string
    ): Promise<string> {
        const nodeRun = runtime.runInNodeMode(
            async (nodeRuntime) => {
                try {
                    const context = dataSources
                        .map((source) => `Source: ${source.name}\n${source.data}`)
                        .join("\n\n---\n\n");

                    const prompt = `You are an objective fact-checker analyzing a prediction market question.
QUESTION: ${question}
POSSIBLE OUTCOMES: ${outcomes.join(", ")}
DATA FROM MULTIPLE SOURCES:
${context}

TASK:
1. Analyze the provided data carefully
2. Determine which outcome is most accurate based on the evidence
3. Provide your confidence level (0-1)
4. Explain your reasoning

RESPOND IN THIS EXACT JSON FORMAT:
{
  "outcome": "the exact outcome from the list above",
  "confidence": 0.95,
  "reasoning": "brief explanation of why this outcome is correct"
}

IMPORTANT:
- Only choose from the provided outcomes
- Be objective and fact-based
- Your response must be valid JSON`;

                    const request = this.httpClient.sendRequest(nodeRuntime, {
                        url: "https://api.openai.com/v1/chat/completions",
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${apiKey}`,
                        },
                        // The engine expects bytes/base64 for the body field if it's a 'bytes' type in proto
                        body: Buffer.from(JSON.stringify({
                            model: "gpt-4o-mini",
                            messages: [
                                {
                                    role: "system",
                                    content: "You are a precise, objective fact-checker. Always respond with valid JSON.",
                                },
                                {
                                    role: "user",
                                    content: prompt,
                                },
                            ],
                            temperature: 0.3,
                            max_tokens: 500,
                        })).toString('base64'),
                    });

                    const response = request.result();
                    const bodyText = new TextDecoder().decode(response.body);
                    const data = JSON.parse(bodyText);

                    if (!data.choices || data.choices.length === 0) {
                        throw new Error(`OpenAI API Error: ${bodyText}`);
                    }

                    const aiText = data.choices[0].message.content;

                    // Extract JSON
                    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
                    if (!jsonMatch) throw new Error(`No JSON found in AI response: ${aiText}`);
                    const parsed = JSON.parse(jsonMatch[0]);

                    // Validate outcome
                    const outcomeIndex = outcomes.findIndex(
                        (o) => o.toLowerCase() === (parsed.outcome || "").toLowerCase()
                    );
                    if (outcomeIndex === -1) throw new Error(`Invalid outcome: ${parsed.outcome}`);

                    return outcomes[outcomeIndex];
                } catch (error) {
                    nodeRuntime.log(`[AI Node] Error: ${error}`);
                    return outcomes[0]; // Fallback
                }
            },
            consensusIdenticalAggregation<string>() as any
        );

        const execution = await nodeRun();
        const result = execution.result();

        try {
            return Value.from(result).unwrap() as string;
        } catch (e) {
            return String(result || outcomes[0]);
        }
    }
}
