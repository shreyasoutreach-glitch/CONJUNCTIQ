import logging
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions

log = logging.getLogger(__name__)

# Initialize ChromaDB in-memory for the Hackathon (ephemeral)
try:
    chroma_client = chromadb.Client(Settings(anonymized_telemetry=False))
    
    # Use default sentence-transformer embedding model (all-MiniLM-L6-v2)
    # It will automatically download weights on first use
    sentence_transformer_ef = embedding_functions.DefaultEmbeddingFunction()
    
    collection = chroma_client.get_or_create_collection(
        name="astronomy_corpus",
        embedding_function=sentence_transformer_ef
    )
except Exception as e:
    log.error(f"Failed to initialize ChromaDB: {e}")
    collection = None

# Initial corpus data (Real domain knowledge)
RAW_DOCUMENTS = [
    {
        "id": "doc1",
        "title": "Conjunction basics",
        "content": "A conjunction is a predicted close approach between two orbiting objects. It is an assessment event indicating a statistical risk, not definitive proof of a collision. Ground systems track these to issue warnings.",
        "metadata": {"title": "Conjunction basics", "source": "ConjunctIQ Base Knowledge", "topic": "Definitions"}
    },
    {
        "id": "doc2",
        "title": "TCA and miss distance",
        "content": "Time of closest approach (TCA) is the exact moment when the predicted separation between two objects is smallest. Miss distance is the predicted physical separation at that time. Smaller miss distances require higher attention.",
        "metadata": {"title": "TCA and miss distance", "source": "ConjunctIQ Base Knowledge", "topic": "Metrics"}
    },
    {
        "id": "doc3",
        "title": "Uncertainty and tracking covariance",
        "content": "Orbital uncertainty describes limits in positional knowledge, often represented as a covariance ellipsoid (radial, along-track, cross-track). New tracking observations can collapse this covariance and refine estimates. Radial uncertainty is typically the most critical for collision probability in LEO.",
        "metadata": {"title": "Uncertainty and tracking covariance", "source": "ConjunctIQ Base Knowledge", "topic": "Astrodynamics"}
    },
    {
        "id": "doc4",
        "title": "Probability of Collision (Pc)",
        "content": "Collision probability is calculated by integrating a 2D Gaussian probability density function over the combined hardbody radius of both objects in the encounter plane. A Pc greater than 1e-4 is often considered an action threshold for active satellites.",
        "metadata": {"title": "Probability of Collision (Pc)", "source": "ConjunctIQ Base Knowledge", "topic": "Statistics"}
    }
]

# Ingest documents on startup
if collection is not None:
    try:
        # Check if already populated
        if collection.count() == 0:
            log.info("Ingesting documents into ChromaDB vector store...")
            collection.add(
                ids=[doc["id"] for doc in RAW_DOCUMENTS],
                documents=[doc["content"] for doc in RAW_DOCUMENTS],
                metadatas=[doc["metadata"] for doc in RAW_DOCUMENTS]
            )
            log.info("Ingestion complete.")
    except Exception as e:
        log.error(f"Error during document ingestion: {e}")

# Fallback for UI if DB fails to initialize
DOCUMENTS = RAW_DOCUMENTS

def retrieve(question: str, limit: int = 2):
    """
    Real semantic retrieval using ChromaDB similarity search.
    """
    if collection is None:
        log.warning("Vector DB unavailable, returning empty context.")
        return []

    try:
        results = collection.query(
            query_texts=[question],
            n_results=limit
        )
        
        retrieved_chunks = []
        # ChromaDB returns lists of lists for queries
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if "metadatas" in results and results["metadatas"] else [{}] * len(docs)
            distances = results["distances"][0] if "distances" in results and results["distances"] else [0] * len(docs)
            
            for doc, meta, dist in zip(docs, metas, distances):
                retrieved_chunks.append({
                    "title": meta.get("title", "Unknown Source"),
                    "content": doc,
                    "source": meta.get("source", "Unknown"),
                    "topic": meta.get("topic", "Unknown"),
                    "similarity_distance": round(dist, 4)
                })
                
        return retrieved_chunks
    except Exception as e:
        log.error(f"Vector search failed: {e}")
        return []
