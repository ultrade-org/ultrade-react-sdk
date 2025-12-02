import { ErrorDto } from './error.dto';
import { IQueryFuncResult } from './types';

/**
 * Wrapper function that handles try-catch and error DTO conversion
 * @param fn - Async function to execute (it is function wrapper around the API call)
 * @returns IQueryFuncResult with data or error
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
): IQueryFuncResult<T> {
  try {
    const data = await fn();
    return { data };
  } catch (error: any) {
    return new ErrorDto(error);
  }
}

