import axios from 'axios';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

export interface OllamaHealthStatus {
  isAvailable: boolean;
  version?: string;
  models?: string[];
  message: string;
}

export class OllamaService {
  /**
   * Check if local Ollama daemon is active and list loaded models
   */
  static async checkHealth(): Promise<OllamaHealthStatus> {
    try {
      const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 2000 });
      const models = response.data.models ? response.data.models.map((m: any) => m.name) : [];
      return {
        isAvailable: true,
        models,
        message: 'Ollama local AI runtime is connected and ready.',
      };
    } catch (error: any) {
      return {
        isAvailable: false,
        message: 'Ollama is offline or unreachable at ' + OLLAMA_BASE_URL + '. Running in smart fallback mode.',
      };
    }
  }

  /**
   * General Prompt Generation with Local Ollama
   */
  static async generate(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const response = await axios.post(
        `${OLLAMA_BASE_URL}/api/generate`,
        {
          model: DEFAULT_MODEL,
          prompt,
          system: systemPrompt || 'You are an expert AI Agency Operations Assistant for ClientPulse SaaS.',
          stream: false,
        },
        { timeout: 30000 }
      );
      return response.data.response;
    } catch (error: any) {
      console.warn(`[Ollama] Failed to contact local daemon (${error.message}). Using fallback.`);
      return this.fallbackResponse(prompt);
    }
  }

  /**
   * Qualify Lead Enquiry (Intent & Urgency Score)
   */
  static async qualifyLead(title: string, description: string, budget?: string) {
    const health = await this.checkHealth();
    if (health.isAvailable) {
      const prompt = `Analyze this client enquiry:
Title: "${title}"
Details: "${description}"
Budget: "${budget || 'Unspecified'}"

Respond ONLY with valid JSON in this format:
{
  "summary": "2 sentence executive summary",
  "intentScore": 0.85, // between 0.00 and 1.00
  "urgency": "High", // Low, Medium, High
  "suggestedServices": ["Web Development", "UI/UX Design"],
  "recommendedAction": "Schedule discovery call within 24 hours"
}`;
      try {
        const raw = await this.generate(prompt, 'You are a CRM AI Qualifier. Respond ONLY with valid raw JSON.');
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // Fallback below
      }
    }

    // Smart Fallback
    const isHighBudget = budget && (budget.includes('k') || parseInt(budget.replace(/\D/g, '') || '0') > 3000);
    return {
      summary: `Inbound enquiry regarding ${title}. Potential scope involves ${description.slice(0, 80)}...`,
      intentScore: isHighBudget ? 0.90 : 0.75,
      urgency: isHighBudget ? 'High' : 'Medium',
      suggestedServices: ['Custom Software Development', 'Client Consultation'],
      recommendedAction: 'Send automated questionnaire and review budget parameters.',
      aiProvider: health.isAvailable ? 'Ollama Local LLM' : 'ClientPulse Heuristic Fallback',
    };
  }

  /**
   * Generate Project Quotation Scope & Line Items
   */
  static async generateScope(requirements: string) {
    const health = await this.checkHealth();
    if (health.isAvailable) {
      const prompt = `Generate a professional quotation scope for: "${requirements}".
Return ONLY raw JSON with this exact structure:
{
  "scopeTitle": "Project Title",
  "items": [
    { "description": "Phase 1: Architecture & UX Wireframes", "quantity": 1, "unitPrice": 1200 },
    { "description": "Phase 2: Core Engineering & Database Implementation", "quantity": 1, "unitPrice": 2500 }
  ],
  "timelineWeeks": 4,
  "terms": "50% upfront deposit, 50% upon milestone completion."
}`;
      try {
        const raw = await this.generate(prompt);
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          return JSON.parse(match[0]);
        }
      } catch (e) {
        // Fallback
      }
    }

    // Smart Fallback
    return {
      scopeTitle: 'Client Delivery & Implementation Plan',
      items: [
        { description: 'Requirement Discovery, System Architecture & UX Prototype', quantity: 1, unitPrice: 1500 },
        { description: 'Full-Stack Development, Database Setup & Core Integration', quantity: 1, unitPrice: 3200 },
        { description: 'Quality Assurance, Playwright Testing & Production Deployment', quantity: 1, unitPrice: 1200 },
      ],
      timelineWeeks: 6,
      terms: 'Payment schedule: 40% initial deposit, 30% midpoint review, 30% upon final delivery.',
      aiProvider: health.isAvailable ? 'Ollama Local LLM' : 'ClientPulse Heuristic Fallback',
    };
  }

  /**
   * Analyze Client Feedback Sentiment
   */
  static async analyzeSentiment(comment: string, rating: number) {
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    let sentimentScore = 0.0;

    if (rating >= 4) {
      sentiment = 'positive';
      sentimentScore = rating === 5 ? 0.95 : 0.70;
    } else if (rating <= 2) {
      sentiment = 'negative';
      sentimentScore = rating === 1 ? -0.90 : -0.50;
    }

    return {
      sentiment,
      sentimentScore,
      actionRecommendation:
        sentiment === 'negative'
          ? 'Urgent client care intervention needed: contact stakeholder within 4 hours.'
          : 'High engagement: identify upsell or testimonial opportunities.',
    };
  }

  private static fallbackResponse(prompt: string): string {
    return `ClientPulse AI Heuristic Engine processed your request. (Start Ollama locally with 'ollama run ${DEFAULT_MODEL}' to unlock live deep-learning inference).`;
  }
}
