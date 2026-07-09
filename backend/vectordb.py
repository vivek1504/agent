import os
from dotenv import load_dotenv

from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

EMBEDDING_DIMENSION = 384

_embedding_model = None
_pc = None
_INDEX_NAME = None


def init_embedding_model():
    global _embedding_model
    from sentence_transformers import SentenceTransformer
    _embedding_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    print("SentenceTransformer loaded")


def _get_pinecone():
    global _pc, _INDEX_NAME
    if _pc is None:
        from pinecone import Pinecone
        api_key = os.getenv("PINECONE_API_KEY")
        if not api_key:
            raise ValueError("PINECONE_API_KEY not found in environment")
        _pc = Pinecone(api_key=api_key)
        _INDEX_NAME = os.getenv("PINECONE_INDEX", "sql-agent")
    return _pc, _INDEX_NAME


def get_index():
    pc, index_name = _get_pinecone()
    from pinecone import ServerlessSpec

    existing_indexes = [idx.name for idx in pc.list_indexes()]

    if index_name not in existing_indexes:
        pc.create_index(
            name=index_name,
            dimension=EMBEDDING_DIMENSION,
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )

    return pc.Index(index_name)


def embed_text(text):
    text = str(text)
    if _embedding_model is None:
        raise RuntimeError("Embedding model not initialized. Call init_embedding_model() first.")
    return _embedding_model.encode(text).tolist()


def upsert_documents(texts: list[str], namespace: str):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )

    chunks = splitter.create_documents(texts)

    index = get_index()

    batch = []

    for i, chunk in enumerate(chunks):
        try:
            vec = embed_text(chunk.page_content)

            batch.append(
                {
                    "id": f"{namespace}-{i}",
                    "values": vec,
                    "metadata": {
                        "text": chunk.page_content
                    }
                }
            )

        except Exception as e:
            print("Embedding Error:", str(e))
            raise

    if batch:
        index.upsert(
            vectors=batch,
            namespace=namespace
        )


def retrieve_context(
    query: str,
    namespace: str,
    top_k: int = 4
):
    index = get_index()

    vec = embed_text(query)

    result = index.query(
        vector=vec,
        top_k=top_k,
        namespace=namespace,
        include_metadata=True
    )

    return "\n\n".join(
        match.metadata.get("text", "")
        for match in result.matches
    )


def delete_namespace(namespace: str):
    get_index().delete(
        delete_all=True,
        namespace=namespace
    )
