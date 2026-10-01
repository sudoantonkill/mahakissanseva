import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { pipeline, env } from '@xenova/transformers';
import { Pinecone } from '@pinecone-database/pinecone';

// Skip local caching to avoid issues with some Node setups if desired, or let it cache
env.allowLocalModels = false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || "sugarcane-rag";

if (!PINECONE_API_KEY) {
  console.error("Missing PINECONE_API_KEY in .env.local");
  process.exit(1);
}

const pc = new Pinecone({ apiKey: PINECONE_API_KEY });

async function ingestData() {
  const index = pc.Index(PINECONE_INDEX_NAME);
  
  console.log("Loading BGE-M3 model...");
  const extractor = await pipeline('feature-extraction', 'Xenova/bge-m3', { quantized: true });
  
  const dataDir = path.resolve(__dirname, '../data');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.md'));
  
  console.log(`Found ${files.length} markdown files to process.`);
  
  const vectors = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
    
    // We'll chunk the file simply by paragraphs to avoid token limits
    const chunks = content.split(/\n\s*\n/).filter(c => c.trim().length > 20);
    
    for (let j = 0; j < chunks.length; j++) {
      const chunk = chunks[j];
      
      try {
        const output = await extractor(chunk, { pooling: 'mean', normalize: true });
        const vectorValues = Array.from(output.data);
        
        vectors.push({
          id: `doc-${file}-chunk-${j}`,
          values: vectorValues,
          metadata: {
            source: file,
            text: chunk.substring(0, 5000) // limit metadata size
          }
        });
      } catch (e) {
        console.error(`Failed to embed chunk ${j} of ${file}:`, e);
      }
    }
    
    console.log(`Processed ${file} (${i+1}/${files.length})`);
  }
  
  console.log(`Generated ${vectors.length} vectors. Upserting to Pinecone in batches of 50...`);
  
  // Pinecone recommends upserting in batches
  const batchSize = 50;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    try {
      await index.upsert({ records: batch });
      console.log(`Upserted batch ${Math.floor(i / batchSize) + 1} (${i} to ${i + batch.length})`);
    } catch (e) {
      console.error(`Failed to upsert batch starting at ${i}:`, e);
    }
  }
  
  console.log('✅ BGE-M3 Ingestion complete!');
}

ingestData().catch(console.error);
