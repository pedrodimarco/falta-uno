import { z } from "zod";

export const requestLoginInput = z.object({
  name: z.string().trim().min(2, "Ingresá al menos dos caracteres.").max(60),
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  returnTo: z.string().max(200).default("/"),
});
export const verifyLoginInput = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
});
export const verifyMobileLoginInput = verifyLoginInput.extend({
  flowToken: z.string().regex(/^[a-f0-9]{64}$/),
});
export interface MobileLoginRequestResponse {
  flowToken: string;
  localMail: boolean;
}
export interface MobileLoginResponse extends VerifyLoginResponse {
  token: string;
}
export interface SessionPerson extends Person {
  email: string | null;
}
export interface SessionResponse {
  person: SessionPerson | null;
  localMail: boolean;
}
export interface VerifyLoginResponse {
  person: SessionPerson;
  returnTo: string;
}

export const matchInput = z.object({
  sport: z.enum(["Fútbol 5", "Pádel", "Básquet", "Otro"]),
  title: z.string().trim().min(3).max(100),
  startsAt: z.iso.datetime({ offset: true }),
  timeZone: z
    .string()
    .max(80)
    .refine((value) => {
      try {
        new Intl.DateTimeFormat("es", { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }, "Zona horaria inválida."),
  venue: z.string().trim().min(2).max(160),
  capacity: z.number().int().min(2).max(50),
  price: z.number().int().min(0).max(100000000).nullable(),
  currency: z.literal("UYU"),
  notes: z.string().trim().max(1000).default(""),
  organizerPlays: z.boolean().default(true),
});
export type MatchInput = z.infer<typeof matchInput>;
export interface Person {
  id: string;
  name: string;
}
export interface MatchSummary {
  id: string;
  sport: MatchInput["sport"];
  title: string;
  startsAt: string;
  timeZone: string;
  venue: string;
  capacity: number;
  confirmed: number;
  reserved: number;
  price: number | null;
  currency: string;
}
export interface MatchDetail extends MatchSummary {
  notes: string;
  organizer: Person;
  players: Person[];
  isOrganizer: boolean;
  joined: boolean;
  closed: boolean;
  waitingList: {
    person: Person;
    position: number;
    status: "waiting" | "offered";
    expiresAt: string | null;
  }[];
  waitlistPosition: number | null;
  waitlistState:
    | "none"
    | "waiting"
    | "offered"
    | "accepted"
    | "declined"
    | "expired"
    | "left"
    | "closed";
  offer: { id: string; expiresAt: string } | null;
}
export interface ApiError {
  error: string;
  code: string;
}
