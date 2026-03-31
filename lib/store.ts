/** Chunk + document shapes shared by embedding and MongoDB storage. */
export type StoredChunk = {
  text: string;
  embedding: number[];
};

export type StoredDocument = {
  fileName: string;
  chunks: StoredChunk[];
  createdAt: number;
};
