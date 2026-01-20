// Discriminated union types for type-safe action results
type ActionSuccess<T = void> = T extends void
    ? { success: true }
    : { success: true; data: T };

type ActionError = { success: false; error: string };

export type ActionResult<T = void> = ActionSuccess<T> | ActionError;
