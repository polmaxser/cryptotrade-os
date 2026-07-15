export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export type CreateNotePayload = {
  title: string;
  content: string;
};

export type UpdateNotePayload = Partial<CreateNotePayload>;
