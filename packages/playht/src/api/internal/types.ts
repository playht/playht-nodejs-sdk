// Collection of branded types to enforce stronger type checking across the codebase.
export type UserId = string & { __brand: 'UserId' };
