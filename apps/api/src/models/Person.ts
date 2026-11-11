export interface Person {
  id: string;
  name: string;
}

export interface SessionPerson extends Person {
  email: string | null;
}
