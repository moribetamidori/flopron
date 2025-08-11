import { GoogleGenAI } from "@google/genai";

interface GeminiNodeGenerationRequest {
  image: string; // base64 encoded image
  clusterName: string;
  existingTags: string[];
  existingContent: string;
}

interface GeminiNodeGenerationResponse {
  title: string;
  content: string;
  tags: string[];
}

export class GeminiService {
  private static instance: GeminiService;
  private apiKey: string | null = null;
  private ai: GoogleGenAI | null = null;

  private constructor() {
    // Try to get API key from localStorage only (process.env not available in renderer)
    try {
      // Prefer persistent settings via Electron, fallback to localStorage
      const w = window as any;
      if (w?.electronAPI?.settings?.get) {
        // Fire and forget; we'll also cache in memory
        w.electronAPI.settings
          .get("geminiApiKey")
          .then((val: unknown) => {
            const key = typeof val === "string" ? val : null;
            if (key) {
              this.apiKey = key;
              this.ai = new GoogleGenAI({ apiKey: key });
            }
          })
          .catch(() => {});
      } else {
        this.apiKey =
          typeof localStorage !== "undefined"
            ? localStorage.getItem("GEMINI_API_KEY")
            : null;
        if (this.apiKey) {
          this.ai = new GoogleGenAI({ apiKey: this.apiKey });
        }
      }
    } catch (error) {
      console.warn("Could not initialize GeminiService:", error);
      this.apiKey = null;
      this.ai = null;
    }
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.ai = new GoogleGenAI({ apiKey });
    try {
      const w = window as any;
      if (w?.electronAPI?.settings?.set) {
        // Persist to settings file
        void w.electronAPI.settings.set("geminiApiKey", apiKey);
      }
      // Also keep localStorage as a secondary fallback
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("GEMINI_API_KEY", apiKey);
      }
    } catch (error) {
      console.warn("Could not save API key to localStorage:", error);
    }
  }

  public getApiKey(): string | null {
    try {
      const w = window as any;
      // Attempt to refresh from persistent storage synchronously by using cached
      // In case not yet initialized, also check localStorage
      if (typeof localStorage !== "undefined") {
        const storedKey = localStorage.getItem("GEMINI_API_KEY");
        if (storedKey) {
          this.apiKey = storedKey;
          this.ai = new GoogleGenAI({ apiKey: storedKey });
        }
      }
      if (w?.electronAPI?.settings?.get) {
        // Kick off async refresh; update cache for future calls
        w.electronAPI.settings
          .get("geminiApiKey")
          .then((val: unknown) => {
            const key = typeof val === "string" ? val : null;
            if (key && key !== this.apiKey) {
              this.apiKey = key;
              this.ai = new GoogleGenAI({ apiKey: key });
            }
          })
          .catch(() => {});
      }
      return this.apiKey;
    } catch (error) {
      console.warn("Could not access localStorage:", error);
      return this.apiKey;
    }
  }

  public async generateNodeFromImage(
    request: GeminiNodeGenerationRequest
  ): Promise<GeminiNodeGenerationResponse> {
    if (!this.apiKey || !this.ai) {
      throw new Error(
        "Gemini API key not configured. Please set your API key in settings."
      );
    }

    const prompt = this.buildPrompt(request);

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            text: prompt,
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: request.image,
            },
          },
        ],
      });

      const generatedText = response.text;

      if (!generatedText) {
        throw new Error("No response generated from Gemini API");
      }

      return this.parseGeminiResponse(generatedText);
    } catch (error) {
      console.error("Gemini API error:", error);
      throw error;
    }
  }

  private buildPrompt(request: GeminiNodeGenerationRequest): string {
    const { clusterName, existingTags, existingContent } = request;

    return `You are an AI assistant helping to create knowledge nodes for a Personal Knowledge Management (PKM) system. 

Analyze the provided image and create a knowledge node with the following requirements:

1. **Title**: Create a concise, descriptive title (max 50 characters) that captures the main subject or concept in the image.

2. **Content**: Write a detailed description (100-200 words) that explains what you see in the image, its context, significance, and any relevant details that would be useful for knowledge management.

3. **Tags**: Generate 3-10 relevant tags that categorize this content. Consider the following:
   - Use existing tags from the cluster when relevant: ${existingTags.join(
     ", "
   )}
   - Create new tags that are consistent with the existing tag style
   - Tags should be single words or short phrases
   - Focus on concepts, themes, and categories rather than specific objects
   - Maximum 10 tags total

**Cluster Context**: This node belongs to the "${clusterName}" cluster. Consider the existing content style and themes in this cluster.

**Existing Content Sample**: ${existingContent.substring(0, 500)}...

**Response Format**: Return your response in the following JSON format exactly:
{
  "title": "Your title here",
  "content": "Your detailed content description here",
  "tags": ["tag1", "tag2", "tag3"]
}

Be thoughtful and accurate in your analysis. The content should be useful for future reference and knowledge discovery.`;
  }

  private parseGeminiResponse(response: string): GeminiNodeGenerationResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Validate the response structure
        if (parsed.title && parsed.content && Array.isArray(parsed.tags)) {
          return {
            title: parsed.title.trim(),
            content: parsed.content.trim(),
            tags: parsed.tags.slice(0, 10), // Ensure max 10 tags
          };
        }
      }

      // Fallback parsing if JSON extraction fails
      throw new Error("Invalid response format from Gemini API");
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      console.log("Raw response:", response);

      // Return a fallback response
      return {
        title: "Image Analysis",
        content:
          "AI analysis of the uploaded image. Please review and edit the content.",
        tags: ["image", "analysis", "pending-review"],
      };
    }
  }
}
