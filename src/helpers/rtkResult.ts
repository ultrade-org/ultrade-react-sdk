import { ErrorDto } from '@utils'
import { IQueryFuncResult } from '@utils';

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
    console.error('Error withErrorHandling:', error);
    return new ErrorDto(error);
  }
}

