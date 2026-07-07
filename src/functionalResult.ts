/**
 * Functional Result Library
 *
 * A type-safe functional programming library for error handling and composition.
 * Provides Result type with discriminated unions for handling success/failure cases
 * without throwing exceptions.
 *
 * Features:
 * - Type-safe error handling with unknown default error type
 * - Curried functions for point-free style programming
 * - Functional programming operations: map, chain, fold, sequence, traverse, validate
 * - Unified async pipe for composing operations
 * - Zero unsafe type assertions
 */

// Core type definition with unknown default error type for better type safety
type Result<T, E = unknown> =
  { success: true; data: T } | { success: false; error: E };

// ValidationError interface for the validate operation
interface ValidationError {
  field: string;
  message: string;
}

/**
 * Creates a successful Result containing the provided data
 * @template T - The type of the success value
 * @template E - The type of the error value (defaults to unknown)
 * @param data - The successful value to wrap
 * @returns A Result representing success
 */
const success = <T, E = unknown>(data: T): Result<T, E> => ({
  success: true,
  data,
});

/**
 * Creates a failed Result containing the provided error
 * @template T - The type of the success value (defaults to never)
 * @template E - The type of the error value
 * @param error - The error value to wrap
 * @returns A Result representing failure
 */
const failure = <T = never, E = unknown>(error: E): Result<T, E> => ({
  success: false,
  error,
});

/**
 * Transforms the success value of a Result using the provided function
 * Curried function: first takes the transformation function, then the Result
 * @template T - Input success type
 * @template U - Output success type
 * @template E - Error type (preserved)
 * @param fn - Function to transform the success value
 * @returns Function that takes a Result and returns the transformed Result
 */
const map =
  <T, U, E>(fn: (data: T) => U) =>
  (result: Result<T, E>): Result<U, E> =>
    result.success ? success(fn(result.data)) : result;

/**
 * Transforms the failure value of a Result using the provided function
 * Curried function: first takes the transformation function, then the Result
 * @template T - Input success type (preserved)
 * @template E - Input error type
 * @template U - Output error type
 * @param fn - Function to transform the error value or create side effects
 * @returns Function that takes a Result and returns the transformed Result
 *  or runs side effects
 */
const mapError =
  <T, U, E>(fn: (error: E) => U) =>
  (result: Result<T, E>): Result<T, U> =>
    result.success ? result : failure(fn(result.error));

/**
 * Chains operations that may fail, flattening nested Results
 * Curried function: first takes the chaining function, then the Result
 * @template T - Input success type
 * @template U - Output success type
 * @template E - Error type (preserved)
 * @param fn - Function that returns a Result
 * @returns Function that takes a Result and returns the chained Result
 */
const chain =
  <T, U, E>(fn: (data: T) => Result<U, E>) =>
  (result: Result<T, E>): Result<U, E> =>
    result.success ? fn(result.data) : result;

/**
 * Pattern matching for Results - executes one of two functions based on Result type
 * Curried function: first takes success/failure handlers, then the Result
 * @template T - Success type
 * @template E - Error type
 * @template R - Return type
 * @param onSuccess - Function to execute on success
 * @param onFailure - Function to execute on failure
 * @returns Function that takes a Result and returns the result of pattern matching
 */
const match =
  <T, E, R>(onSuccess: (data: T) => R, onFailure: (error: E) => R) =>
  (result: Result<T, E>): R =>
    result.success ? onSuccess(result.data) : onFailure(result.error);

/**
 * Folds a Result into a single value using the provided functions
 * Curried function: first takes success/failure handlers, then the Result
 * Alias for match with more semantic meaning for final value extraction
 * @template T - Success type
 * @template E - Error type
 * @template R - Return type
 * @param onSuccess - Function to execute on success
 * @param onFailure - Function to execute on failure
 * @returns Function that takes a Result and returns the folded value
 */
const fold =
  <T, E, R>(onSuccess: (data: T) => R, onFailure: (error: E) => R) =>
  (result: Result<T, E>): R =>
    match(onSuccess, onFailure)(result);

/**
 * Executes a sequence of Results, collecting all success values or returning first failure
 * @template T - Success type of individual Results
 * @template E - Error type
 * @param results - Array of Results to sequence
 * @returns Result containing array of success values or first failure encountered
 */
const sequence = <T, E>(results: Result<T, E>[]): Result<T[], E> => {
  const acc: T[] = [];
  for (const result of results) {
    if (!result.success) return result;
    acc.push(result.data);
  }
  return success(acc);
};

/**
 * Maps over an array using a function that returns Results, then sequences the results
 * Curried function: first takes the mapping function, then the array
 * @template T - Input array element type
 * @template U - Output Result success type
 * @template E - Error type
 * @param fn - Function that maps array elements to Results
 * @returns Function that takes an array and returns a sequenced Result
 */
const traverse =
  <T, U, E>(fn: (item: T) => Result<U, E>) =>
  (items: T[]): Result<U[], E> =>
    sequence(items.map(fn));

/**
 * Partitions an array of Results into successes and failures
 * Useful when you want to collect all successful results while still handling failures separately
 * @template T - Success type of individual Results
 * @template E - Error type
 * @param results - Array of Results to partition
 * @returns Object containing arrays of successful values and error objects
 */
const partitionResults = <T, E>(
  results: Result<T, E>[]
): {
  successes: T[];
  failures: Array<{ error: E }>;
} => {
  const successes: T[] = [];
  const failures: Array<{ error: E }> = [];
  for (const result of results) {
    if (result.success) {
      successes.push(result.data);
    } else {
      failures.push({ error: result.error });
    }
  }
  return { successes, failures };
};

/**
 * Validates a value against an array of validator functions
 * Curried function: first takes validators, then the value to validate
 * @template T - Type of value to validate
 * @param validators - Array of validator functions that return ValidationError or null
 * @returns Function that takes a value and returns validation Result
 */
const validate =
  <T>(validators: ((t: T) => ValidationError | null)[]) =>
  (value: T): Result<T, ValidationError[]> => {
    const errors = validators
      .map(v => v(value))
      .filter((v): v is ValidationError => v !== null);
    return errors.length > 0 ? failure(errors) : success(value);
  };

/**
 * Type guard to check if a Result is successful and narrow its type
 * @template T - Success type
 * @template E - Error type
 * @param result - Result to check
 * @returns True if Result is successful
 */
const isSuccess = <T, E>(
  result: Result<T, E>
): result is { success: true; data: T } => result.success;

/**
 * Type guard to check if a Result is a failure and narrow its type
 * @template T - Success type
 * @template E - Error type
 * @param result - Result to check
 * @returns True if Result is a failure
 */
const isFailure = <T, E>(
  result: Result<T, E>
): result is { success: false; error: E } => !result.success;

/**
 * Wraps a function in a try-catch block, returning a Result
 * Handles both synchronous and asynchronous functions with a unified interface
 *
 * @example
 * ```typescript
 * // Sync function
 * const syncResult = await tryCatch(() => 42)
 *
 * // Async function
 * const asyncResult = await tryCatch(async () => 42)
 *
 * // With error transformation
 * const result = await tryCatch(
 *   () => riskyOperation(),
 *   error => `Custom: ${error}`
 * )
 * ```
 *
 * @template T - Return type of the function
 * @template E - Error type (defaults to unknown)
 * @param fn - Function to wrap (sync or async)
 * @param errorTransformer - Optional function to transform caught errors
 * @returns Promise resolving to a Result
 */
const tryCatch = async <T, E = unknown>(
  fn: (() => T) | (() => Promise<T>),
  errorTransformer?: (error: unknown) => E
): Promise<Result<T, E>> => {
  try {
    const data = await Promise.resolve(fn());
    return success<T, E>(data);
  } catch (error) {
    const transformedError = errorTransformer
      ? errorTransformer(error)
      : (error as E);
    return failure<T, E>(transformedError);
  }
};

/**
 * Extracts the success value or returns a default value
 * Curried function: first takes default value, then the Result
 * @template T - Success type
 * @template E - Error type
 * @param defaultValue - Default value to return on failure
 * @returns Function that takes a Result and returns the value or default
 */
const getOrElse =
  <T, E>(defaultValue: T) =>
  (result: Result<T, E>): T =>
    result.success ? result.data : defaultValue;

/**
 * Extracts the success value from a Result or throws the error
 * @template T - Success type
 * @template E - Error type
 * @param result - The Result to extract from
 * @returns The success value
 * @throws The error value if Result is a failure
 */
const unwrapResult = <T, E>(result: Result<T, E>): T => {
  if (result.success) return result.data;
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  throw result.error;
};

/**
 * Alias for unwrapResult - extracts the success value or throws the error
 * @template T - Success type
 * @template E - Error type
 * @param result - The Result to extract from
 * @returns The success value
 * @throws The error value if Result is a failure
 */
const getOrThrow = unwrapResult;

/**
 * Unified pipe function for composing Result operations
 * Handles both synchronous and asynchronous operations through Promise resolution
 * Provides overloads for up to 10 operations for proper type inference through the chain
 * Falls back gracefully for longer chains (returns Promise<Result<any, E>>)
 * @template T - Initial success type
 * @template E - Error type (preserved throughout chain)
 * @param initial - Initial Result or Promise<Result>
 * @param operations - Operations that transform Results
 * @returns Promise resolving to the final Result
 */
function pipe<T, E>(
  initial: Result<T, E> | Promise<Result<T, E>>
): Promise<Result<T, E>>;
function pipe<T, E, T1>(
  initial: Result<T, E> | Promise<Result<T, E>>,
  op1: (r: Result<T, E>) => Result<T1, E> | Promise<Result<T1, E>>
): Promise<Result<T1, E>>;
function pipe<T, E, T1, T2>(
  initial: Result<T, E> | Promise<Result<T, E>>,
  op1: (r: Result<T, E>) => Result<T1, E> | Promise<Result<T1, E>>,
  op2: (r: Result<T1, E>) => Result<T2, E> | Promise<Result<T2, E>>
): Promise<Result<T2, E>>;
function pipe<T, E, T1, T2, T3>(
  initial: Result<T, E> | Promise<Result<T, E>>,
  op1: (r: Result<T, E>) => Result<T1, E> | Promise<Result<T1, E>>,
  op2: (r: Result<T1, E>) => Result<T2, E> | Promise<Result<T2, E>>,
  op3: (r: Result<T2, E>) => Result<T3, E> | Promise<Result<T3, E>>
): Promise<Result<T3, E>>;
function pipe<T, E, T1, T2, T3, T4>(
  initial: Result<T, E> | Promise<Result<T, E>>,
  op1: (r: Result<T, E>) => Result<T1, E> | Promise<Result<T1, E>>,
  op2: (r: Result<T1, E>) => Result<T2, E> | Promise<Result<T2, E>>,
  op3: (r: Result<T2, E>) => Result<T3, E> | Promise<Result<T3, E>>,
  op4: (r: Result<T3, E>) => Result<T4, E> | Promise<Result<T4, E>>
): Promise<Result<T4, E>>;
function pipe<T, E, T1, T2, T3, T4, T5>(
  initial: Result<T, E> | Promise<Result<T, E>>,
  op1: (r: Result<T, E>) => Result<T1, E> | Promise<Result<T1, E>>,
  op2: (r: Result<T1, E>) => Result<T2, E> | Promise<Result<T2, E>>,
  op3: (r: Result<T2, E>) => Result<T3, E> | Promise<Result<T3, E>>,
  op4: (r: Result<T3, E>) => Result<T4, E> | Promise<Result<T4, E>>,
  op5: (r: Result<T4, E>) => Result<T5, E> | Promise<Result<T5, E>>
): Promise<Result<T5, E>>;
function pipe<T, E, T1, T2, T3, T4, T5, T6>(
  initial: Result<T, E> | Promise<Result<T, E>>,
  op1: (r: Result<T, E>) => Result<T1, E> | Promise<Result<T1, E>>,
  op2: (r: Result<T1, E>) => Result<T2, E> | Promise<Result<T2, E>>,
  op3: (r: Result<T2, E>) => Result<T3, E> | Promise<Result<T3, E>>,
  op4: (r: Result<T3, E>) => Result<T4, E> | Promise<Result<T4, E>>,
  op5: (r: Result<T4, E>) => Result<T5, E> | Promise<Result<T5, E>>,
  op6: (r: Result<T5, E>) => Result<T6, E> | Promise<Result<T6, E>>
): Promise<Result<T6, E>>;
function pipe<T, E, T1, T2, T3, T4, T5, T6, T7>(
  initial: Result<T, E> | Promise<Result<T, E>>,
  op1: (r: Result<T, E>) => Result<T1, E> | Promise<Result<T1, E>>,
  op2: (r: Result<T1, E>) => Result<T2, E> | Promise<Result<T2, E>>,
  op3: (r: Result<T2, E>) => Result<T3, E> | Promise<Result<T3, E>>,
  op4: (r: Result<T3, E>) => Result<T4, E> | Promise<Result<T4, E>>,
  op5: (r: Result<T4, E>) => Result<T5, E> | Promise<Result<T5, E>>,
  op6: (r: Result<T5, E>) => Result<T6, E> | Promise<Result<T6, E>>,
  op7: (r: Result<T6, E>) => Result<T7, E> | Promise<Result<T7, E>>
): Promise<Result<T7, E>>;
function pipe<T, E, T1, T2, T3, T4, T5, T6, T7, T8>(
  initial: Result<T, E> | Promise<Result<T, E>>,
  op1: (r: Result<T, E>) => Result<T1, E> | Promise<Result<T1, E>>,
  op2: (r: Result<T1, E>) => Result<T2, E> | Promise<Result<T2, E>>,
  op3: (r: Result<T2, E>) => Result<T3, E> | Promise<Result<T3, E>>,
  op4: (r: Result<T3, E>) => Result<T4, E> | Promise<Result<T4, E>>,
  op5: (r: Result<T4, E>) => Result<T5, E> | Promise<Result<T5, E>>,
  op6: (r: Result<T5, E>) => Result<T6, E> | Promise<Result<T6, E>>,
  op7: (r: Result<T6, E>) => Result<T7, E> | Promise<Result<T7, E>>,
  op8: (r: Result<T7, E>) => Result<T8, E> | Promise<Result<T8, E>>
): Promise<Result<T8, E>>;
function pipe<T, E, T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  initial: Result<T, E> | Promise<Result<T, E>>,
  op1: (r: Result<T, E>) => Result<T1, E> | Promise<Result<T1, E>>,
  op2: (r: Result<T1, E>) => Result<T2, E> | Promise<Result<T2, E>>,
  op3: (r: Result<T2, E>) => Result<T3, E> | Promise<Result<T3, E>>,
  op4: (r: Result<T3, E>) => Result<T4, E> | Promise<Result<T4, E>>,
  op5: (r: Result<T4, E>) => Result<T5, E> | Promise<Result<T5, E>>,
  op6: (r: Result<T5, E>) => Result<T6, E> | Promise<Result<T6, E>>,
  op7: (r: Result<T6, E>) => Result<T7, E> | Promise<Result<T7, E>>,
  op8: (r: Result<T7, E>) => Result<T8, E> | Promise<Result<T8, E>>,
  op9: (r: Result<T8, E>) => Result<T9, E> | Promise<Result<T9, E>>
): Promise<Result<T9, E>>;
function pipe<T, E, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
  initial: Result<T, E> | Promise<Result<T, E>>,
  op1: (r: Result<T, E>) => Result<T1, E> | Promise<Result<T1, E>>,
  op2: (r: Result<T1, E>) => Result<T2, E> | Promise<Result<T2, E>>,
  op3: (r: Result<T2, E>) => Result<T3, E> | Promise<Result<T3, E>>,
  op4: (r: Result<T3, E>) => Result<T4, E> | Promise<Result<T4, E>>,
  op5: (r: Result<T4, E>) => Result<T5, E> | Promise<Result<T5, E>>,
  op6: (r: Result<T5, E>) => Result<T6, E> | Promise<Result<T6, E>>,
  op7: (r: Result<T6, E>) => Result<T7, E> | Promise<Result<T7, E>>,
  op8: (r: Result<T7, E>) => Result<T8, E> | Promise<Result<T8, E>>,
  op9: (r: Result<T8, E>) => Result<T9, E> | Promise<Result<T9, E>>,
  op10: (r: Result<T9, E>) => Result<T10, E> | Promise<Result<T10, E>>
): Promise<Result<T10, E>>;

/* eslint-disable @typescript-eslint/no-explicit-any */
async function pipe<T, E>(
  initial: Result<T, E> | Promise<Result<T, E>>,
  ...operations: Array<
    (result: Result<any, E>) => Result<any, E> | Promise<Result<any, E>>
  >
): Promise<Result<any, E>> {
  /* eslint-enable @typescript-eslint/no-explicit-any */
  let current = await Promise.resolve(initial);
  for (const operation of operations) {
    current = await Promise.resolve(operation(current));
  }
  return current;
}

// Export everything
export type { Result, ValidationError };
export {
  success,
  failure,
  map,
  chain,
  match,
  fold,
  sequence,
  traverse,
  partitionResults,
  mapError,
  validate,
  isSuccess,
  isFailure,
  tryCatch,
  getOrElse,
  getOrThrow,
  unwrapResult,
  pipe,
};
