export const hasAllArgs = (args: unknown[]): boolean => {
  return args.every(arg => Boolean(arg) || arg === 0 );
}