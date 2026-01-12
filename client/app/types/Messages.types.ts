export interface MessageTypes {
  type: string;
  content: string;
  created_at: number | Date;
  username: string;
  userId?: string;
}
