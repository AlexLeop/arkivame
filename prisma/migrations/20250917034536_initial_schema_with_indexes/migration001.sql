-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable
-- Adiciona a coluna 'embedding' na tabela 'knowledge_items'.
-- O número 1536 corresponde à dimensionalidade dos vetores do modelo 'text-embedding-3-small' da OpenAI.
-- Se você usar outro modelo, ajuste este valor.
ALTER TABLE "knowledge_items" ADD COLUMN "embedding" vector(1536);

-- CreateIndex
-- Cria um índice para otimizar a busca por similaridade.
-- Usamos o índice IVFFlat, que é um bom ponto de partida para até 1 milhão de vetores.
CREATE INDEX ON "knowledge_items" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);