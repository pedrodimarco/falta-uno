export interface Person {
  id: string;
  name: string;
  isGuest?: boolean;
}

export interface SessionPerson extends Person {
  email: string | null;
}
