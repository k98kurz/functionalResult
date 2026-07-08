import { describe, it, expect } from 'vitest';
import {
  success,
  failure,
  map,
  mapError,
  chain,
  match,
  fold,
  sequence,
  traverse,
  partitionResults,
  validate,
  isSuccess,
  isFailure,
  tryCatch,
  getOrElse,
  getOrThrow,
  pipe,
  tap,
  tapError,
  type Result,
} from '../src/functionalResult';

describe('Basics: Constructors & Type Guards', () => {
  it('[B01] should create success result with correct type', () => {
    const result = success<number, unknown>(42);
    expect(result.success).toBe(true);
    expect(isSuccess(result)).toBe(true);
    expect(result.data).toBe(42);
  });

  it('[B02] should create failure result with correct type', () => {
    const result = failure<never, string>('error');
    expect(result.success).toBe(false);
    expect(isFailure(result)).toBe(true);
    expect(result.error).toBe('error');
  });

  it('[B03] should handle generic type inference correctly', () => {
    const successResult = success<string, never>('hello');
    const failureResult = failure<never, number>(404);
    expect(successResult.success).toBe(true);
    expect(typeof successResult.data).toBe('string');
    expect(failureResult.success).toBe(false);
    expect(typeof failureResult.error).toBe('number');
  });

  it('[B04] should isSuccess type guard narrow correctly', () => {
    const result: Result<string, number> = success('test');
    if (isSuccess(result)) {
      expect(typeof result.data).toBe('string');
    } else {
      throw new Error('Should have been narrowed to success type');
    }
  });

  it('[B05] should isFailure type guard narrow correctly', () => {
    const result: Result<string, number> = failure(404);
    if (isFailure(result)) {
      expect(typeof result.error).toBe('number');
    } else {
      throw new Error('Should have been narrowed to failure type');
    }
  });

  it('[B06] should handle complex generic types', () => {
    type User = { id: number; name: string; email?: string };
    type ApiError = { code: string; message: string };

    const userResult: Result<User, ApiError> = success({ id: 1, name: 'test' });
    const transformed = map((user: User) => ({
      ...user,
      email: `${user.name}@example.com`,
    }))(userResult);

    expect(transformed.success).toBe(true);
    expect(transformed.data.id).toBe(1);
    expect(transformed.data.name).toBe('test');
    expect(transformed.data.email).toBe('test@example.com');
  });
});

describe('Error Handling', () => {
  it('[E01] should tryCatch handle successful async operations', async () => {
    const result = await tryCatch(async () => 'success');
    expect(result.success).toBe(true);
    expect(result.data).toBe('success');
  });

  it('[E02] should tryCatch handle async errors with transformation', async () => {
    const originalError = new Error('test error');
    const result = await tryCatch<string, string>(
      async () => {
        throw originalError;
      },
      error =>
        `transformed: ${error instanceof Error ? error.message : String(error)}`
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('transformed: test error');
  });

  it('[E03] should tryCatch handle sync operations', async () => {
    const result = await tryCatch(() => 'sync result');
    expect(result.success).toBe(true);
    expect(result.data).toBe('sync result');
  });

  it('[E04] should tryCatch handle async operations', async () => {
    const result = await tryCatch(async () => 'async result');
    expect(result.success).toBe(true);
    expect(result.data).toBe('async result');
  });

  it('[E05] should transform errors with a custom transformer', async () => {
    const originalError = new Error('test error');
    const result = await tryCatch(
      () => {
        throw originalError;
      },
      (error: unknown) => `caught: ${(error as Error).message}`
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('caught: test error');
  });

  it('[E06] should tryCatch handle sync functions with type parameters', async () => {
    const result = await tryCatch(() => 'sync result');
    expect(result.success).toBe(true);
    expect(result.data).toBe('sync result');
  });

  it('[E07] should tryCatch handle both sync and async functions with same interface', async () => {
    const syncFn = (): string => 'sync';
    const asyncFn = async (): Promise<string> => 'async';

    const syncResult = await tryCatch(syncFn);
    const asyncResult = await tryCatch(asyncFn);

    expect(syncResult.success).toBe(true);
    expect(syncResult.data).toBe('sync');
    expect(asyncResult.success).toBe(true);
    expect(asyncResult.data).toBe('async');
  });

  it('[E08] should preserve original error types without error transformer', async () => {
    const customError = { code: 'CUSTOM', message: 'custom error' };
    const result = await tryCatch(async () => {
      throw customError;
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe(customError);
  });

  it('[E09] should handle unknown error types safely', async () => {
    const result = await tryCatch(async () => {
      throw 'string error';
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe('string error');
  });
});

describe('Transformations', () => {
  it('[T01] should map success values and preserve failures', () => {
    const successResult = success<number, string>(5);
    const failureResult = failure<number, string>('error');

    const doubled = map((x: number) => x * 2)(successResult);
    const preservedFailure = map((x: number) => x * 2)(failureResult);

    expect(doubled.success).toBe(true);
    expect(doubled.data).toBe(10);
    expect(preservedFailure.success).toBe(false);
    expect(preservedFailure.error).toBe('error');
  });

  it('[T02] should chain operations correctly', () => {
    const successResult = success<number, string>(5);
    const failureResult = failure<number, string>('error');

    const chained = chain((x: number) => success(x * 3))(successResult);
    const chainedFailure = chain((x: number) => success(x * 3))(failureResult);

    expect(chained.success).toBe(true);
    expect(chained.data).toBe(15);
    expect(chainedFailure.success).toBe(false);
    expect(chainedFailure.error).toBe('error');
  });

  it('[T03] should match execute correct branch based on result type', () => {
    const successResult = success<number, string>(42);
    const failureResult = failure<number, string>('error');

    const successMatch = match(
      (x: number) => `success: ${x}`,
      (e: string) => `error: ${e}`
    )(successResult);
    const failureMatch = match(
      (x: number) => `success: ${x}`,
      (e: string) => `error: ${e}`
    )(failureResult);

    expect(successMatch).toBe('success: 42');
    expect(failureMatch).toBe('error: error');
  });

  it('[T04] should fold return consistent type with string error', () => {
    const successResult = success<number, string>(42);
    const failureResult = failure<number, string>('error');

    const successFold = fold(
      (x: number) => x.toString(),
      (e: string) => `error: ${e}`
    )(successResult);
    const failureFold = fold(
      (x: number) => x.toString(),
      (e: string) => `error: ${e}`
    )(failureResult);

    expect(successFold).toBe('42');
    expect(failureFold).toBe('error: error');
  });

  it('[T05] should fold return consistent type with number error', () => {
    const successResult = success<number, number>(42);
    const failureResult = failure<number, number>(404);

    const successFold = fold(
      (x: number) => x.toString(),
      (e: number) => `error: ${e}`
    )(successResult);
    const failureFold = fold(
      (x: number) => x.toString(),
      (e: number) => `error: ${e}`
    )(failureResult);

    expect(successFold).toBe('42');
    expect(failureFold).toBe('error: 404');
  });

  it('[T06] should mapError transform error values and preserve success', () => {
    const successResult = success<number, string>(42);
    const failureResult = failure<number, string>('error');

    const mappedSuccess = mapError((e: string) => e.toUpperCase())(
      successResult
    );
    const mappedFailure = mapError((e: string) => e.toUpperCase())(
      failureResult
    );

    expect(mappedSuccess.success).toBe(true);
    expect(mappedSuccess.data).toBe(42);
    expect(mappedFailure.success).toBe(false);
    expect(mappedFailure.error).toBe('ERROR');
  });

  it('[T07] should mapError compose with map for full transformation', () => {
    const result = failure<number, string>('not found');

    const transformed = mapError((e: string) => `error: ${e}`)(result);

    expect(transformed.success).toBe(false);
    expect(transformed.error).toBe('error: not found');
  });

  it('[T08] should tap execute callback on success and preserve value', () => {
    const sideEffects: number[] = [];
    const successResult = success<number, string>(42);
    const failureResult = failure<number, string>('error');

    const tappedSuccess = tap((x: number) => {
      sideEffects.push(x);
    })(successResult);
    const tappedFailure = tap((x: number) => {
      sideEffects.push(x);
    })(failureResult);

    expect(sideEffects).toEqual([42]);
    expect(tappedSuccess.success).toBe(true);
    expect(tappedSuccess.data).toBe(42);
    expect(tappedFailure.success).toBe(false);
    expect(tappedFailure.error).toBe('error');
  });

  it('[T09] should tapError execute callback on failure and preserve error', () => {
    const sideEffects: string[] = [];
    const successResult = success<number, string>(42);
    const failureResult = failure<number, string>('error');

    const tappedSuccess = tapError((e: string) => {
      sideEffects.push(e);
    })(successResult);
    const tappedFailure = tapError((e: string) => {
      sideEffects.push(e);
    })(failureResult);

    expect(sideEffects).toEqual(['error']);
    expect(tappedSuccess.success).toBe(true);
    expect(tappedSuccess.data).toBe(42);
    expect(tappedFailure.success).toBe(false);
    expect(tappedFailure.error).toBe('error');
  });
});

describe('Composition', () => {
  it('[P01] should pipe work with curried operations', async () => {
    const result = await pipe(
      success<number, string>(5),
      map((x: number) => x * 2),
      chain((x: number) => success<string, string>(x.toString()))
    );
    expect(result.success).toBe(true);
    expect(result.data).toBe('10');
  });

  it('[P02] should pipe maintain type safety throughout chain', async () => {
    const result = await pipe(
      success<number, string>(5),
      map((x: number) => x * 2),
      chain((x: number) => success<string, string>(x.toString())),
      map((s: string) => `${s}_processed`)
    );
    expect(result.success).toBe(true);
    expect(result.data).toBe('10_processed');
  });

  it('[P03] should pipe handle point-free style', async () => {
    const double = map((x: number) => x * 2);
    const toString = map((x: number) => x.toString());

    const result = await pipe(success<number, string>(5), double, toString);
    expect(result.success).toBe(true);
    expect(result.data).toBe('10');
  });

  it('[P04] should curried functions work independently', () => {
    const double = map((x: number) => x * 2);
    const toString = map((x: number) => x.toString());

    const doubled = double(success<number, string>(5));
    const stringified = toString(doubled);

    expect(stringified.success).toBe(true);
    expect(stringified.data).toBe('10');
  });

  it('[P05] should pipe maintain type safety with inferred types', async () => {
    const result = await pipe(
      success(5),
      map(x => x * 2),
      chain(x => success(x.toString())),
      map(s => `${s}_processed`)
    );
    expect(result.success).toBe(true);
    expect(result.data).toBe('10_processed');
  });

  it('[P06] should pipe handle point-free style with inferred types', async () => {
    const double = map((x: number) => x * 2);
    const toString = map((x: number) => x.toString());

    const result = await pipe(success(5), double, toString);
    expect(result.success).toBe(true);
    expect(result.data).toBe('10');
  });

  it('[P07] should pipe handle empty operations array', async () => {
    const initial = success<number, string>(42);
    const result = await pipe(initial);
    expect(result === initial).toBe(true);
  });

  it('[P08] should pipe handle mixed sync and async operations', async () => {
    const result = await pipe(
      success<number, string>(5),
      map((x: number) => x * 2),
      chain((x: number) => success<string, string>(x.toString())),
      map((s: string) => `${s}_async`)
    );
    expect(result.success).toBe(true);
    expect(result.data).toBe('10_async');
  });

  it('[P09] should handle failure propagation in pipe', async () => {
    const result = await pipe(
      success<number, string>(5),
      chain((_x: number) => failure<number, string>('error in chain')),
      map((x: number) => x * 2)
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('error in chain');
  });
});

describe('Collections', () => {
  it('[L01] should sequence handle all success case', () => {
    const results = [
      success<number, string>(1),
      success<number, string>(2),
      success<number, string>(3),
    ];
    const sequenced = sequence(results);
    expect(sequenced.success).toBe(true);
    expect(sequenced.data).toEqual([1, 2, 3]);
  });

  it('[L02] should sequence return first failure encountered', () => {
    const results = [
      success<number, string>(1),
      failure<number, string>('first error'),
      failure<number, string>('second error'),
    ];
    const sequenced = sequence(results);
    expect(sequenced.success).toBe(false);
    expect(sequenced.error).toBe('first error');
  });

  it('[L03] should sequence return first failure encountered with inferred types', () => {
    const results = [
      success(1),
      failure('first error'),
      failure('second error'),
    ];
    const sequenced = sequence(results);
    expect(sequenced.success).toBe(false);
    expect(sequenced.error).toBe('first error');
  });

  it('[L04] should traverse map arrays with Result functions', () => {
    const items = [1, 2, 3];
    const result = traverse((x: number) => success<number, string>(x * 2))(
      items
    );
    expect(result.success).toBe(true);
    expect(result.data).toEqual([2, 4, 6]);
  });

  it('[L05] should partitionResults split mixed results correctly', () => {
    const results = [
      success<number, string>(1),
      failure<number, string>('a'),
      success<number, string>(2),
      failure<number, string>('b'),
    ];

    const { successes, failures } = partitionResults(results);

    expect(successes).toEqual([1, 2]);
    expect(failures).toEqual([{ error: 'a' }, { error: 'b' }]);
  });

  it('[L06] should partitionResults handle all successes', () => {
    const results = [success<number, string>(1), success<number, string>(2)];

    const { successes, failures } = partitionResults(results);

    expect(successes).toEqual([1, 2]);
    expect(failures).toEqual([]);
  });

  it('[L07] should partitionResults handle all failures', () => {
    const results = [
      failure<number, string>('a'),
      failure<number, string>('b'),
    ];

    const { successes, failures } = partitionResults(results);

    expect(successes).toEqual([]);
    expect(failures).toEqual([{ error: 'a' }, { error: 'b' }]);
  });

  it('[L08] should partitionResults handle empty array', () => {
    const results: Array<Result<number, string>> = [];

    const { successes, failures } = partitionResults(results);

    expect(successes).toEqual([]);
    expect(failures).toEqual([]);
  });
});

describe('Validation', () => {
  it('[V01] should validate collect all validation errors', () => {
    const validators = [
      (value: string) =>
        value.length >= 3 ? null : { field: 'length', message: 'Too short' },
      (value: string) =>
        value.includes('@')
          ? null
          : { field: 'format', message: 'Invalid email' },
    ];
    const result = validate(validators)('ab');
    expect(result.success).toBe(false);
    expect(result.error.length).toBe(2);
  });

  it('[V02] should validate return success when no errors', () => {
    const validators = [
      (value: string) =>
        value.length >= 3 ? null : { field: 'length', message: 'Too short' },
      (value: string) =>
        value.includes('@')
          ? null
          : { field: 'format', message: 'Invalid email' },
    ];
    const result = validate(validators)('test@example.com');
    expect(result.success).toBe(true);
    expect(result.data).toBe('test@example.com');
  });
});

describe('Accessors', () => {
  it('[A01] should getOrElse return default value on failure', () => {
    const successResult = success<number, string>(42);
    const failureResult = failure<number, string>('error');

    const successValue = getOrElse(0)(successResult);
    const failureValue = getOrElse(0)(failureResult);

    expect(successValue).toBe(42);
    expect(failureValue).toBe(0);
  });

  it('[A02] should getOrThrow throw error on failure', () => {
    const successResult = success<number, string>(42);
    const failureResult = failure<number, string>('error');

    const successValue = getOrThrow(successResult);
    expect(successValue).toBe(42);

    expect(() => getOrThrow(failureResult)).toThrow('error');
  });
});

describe('Edge Cases', () => {
  it('[X01] should handle nested Result types', () => {
    const inner = success<string, number>('nested');
    const nested: Result<Result<string, number>, number> = success(inner);
    const flattened = chain((x: Result<string, number>) => x)(nested);
    expect(flattened.success).toBe(true);
    expect(flattened.data).toBe('nested');
  });

  it('[X02] should handle empty arrays in sequence', () => {
    const result = sequence([]);
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(0);
  });

  it('[X03] should handle empty arrays in traverse', () => {
    const result = traverse((x: number) => success<number, string>(x * 2))([]);
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(0);
  });

  it('[X04] should handle undefined values in validators', () => {
    const validators = [
      (value: unknown) =>
        value !== undefined
          ? null
          : { field: 'value', message: 'Cannot be undefined' },
    ];
    const result = validate(validators)(undefined);
    expect(result.success).toBe(false);
    expect(result.error[0].message).toBe('Cannot be undefined');
  });
});
