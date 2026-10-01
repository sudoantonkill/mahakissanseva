import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';
import { pipeline, env } from '@xenova/transformers';

// Avoid fetching remote model weights repeatedly if possible, though vercel serverless might not cache well.
env.allowLocalModels = false;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "";
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || "sugarcane-rag";

// Initialize singleton extractor to avoid loading BGE-M3 on every request
let extractorPipeline: any = null;
async function getExtractor() {
  if (!extractorPipeline) {
    extractorPipeline = await pipeline('feature-extraction', 'Xenova/bge-m3', { quantized: true });
  }
  return extractorPipeline;
}

export async function POST(req: Request) {
  try {
    const { message, image, history } = await req.json();

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ 
        reply: "**System Notice:** Please set your `GEMINI_API_KEY` in the `.env.local` file to enable the AI." 
      }, { status: 200 }); 
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // 1. (Optional RAG Step) Get embeddings using BGE-M3 and query Pinecone
    let contextFromPinecone = "";
    if (PINECONE_API_KEY && message) {
      try {
        const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
        const index = pc.Index(PINECONE_INDEX_NAME);
        
        // Generate embedding using BGE-M3
        const extractor = await getExtractor();
        const output = await extractor(message, { pooling: 'mean', normalize: true });
        const vector = Array.from(output.data) as number[];

        // Query Pinecone
        const queryResponse = await index.query({
          vector: vector,
          topK: 5,
          includeMetadata: true,
        });

        if (queryResponse.matches.length > 0) {
          contextFromPinecone = queryResponse.matches
            .map((match: any) => match.metadata?.text || "")
            .join("\n\n---\n\n");
        }
      } catch (error) {
        console.warn("Pinecone RAG step failed or not fully configured:", error);
      }
    }

    // 2. Prepare the prompt and model
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

    const systemInstruction = `You are a specialized Agricultural AI Expert focusing exclusively on Sugarcane farming in Maharashtra, India.
Your goal is to help farmers with expert guidance on pesticides, infections, irrigation, soil management, and crop yields.
Use the context provided below (if any) to ground your answers. The context contains rich regional reports and facts.
If the user uploads an image, analyze it for diseases, pests, or nutrient deficiencies common in Maharashtra's sugarcane.
Always be polite, provide actionable advice, and format your output nicely using markdown.

Context from Knowledge Base:
${contextFromPinecone ? contextFromPinecone : "No additional knowledge base context available at the moment."}
`;

    // 3. Prepare the parts for the Gemini API call
    const parts: any[] = [];
    
    const promptWithContext = `${systemInstruction}\n\nUser Query: ${message}`;
    parts.push(promptWithContext);

    // Add image if present
    if (image) {
      const mimeTypeMatch = image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
      const base64Data = image.split(',')[1];
      
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }

    // 4. Generate Content
    const result = await model.generateContent(parts);
    const responseText = result.response.text();

    return NextResponse.json({ reply: responseText });
    
  } catch (error: any) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request.", details: error.message },
      { status: 500 }
    );
  }
}
