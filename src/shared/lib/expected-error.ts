/**
 * Base class for errors that are a normal outcome shown to the user
 * (e.g. "product not found"), as opposed to bugs that should be reported.
 */
export class ExpectedError extends Error {}
