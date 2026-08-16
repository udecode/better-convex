import { loadClackPrompts } from './lazy-deps.js';

type ClackSpinner = ReturnType<typeof import('@clack/prompts').spinner>;

export const createSpinner = (
  text?: string,
  options: {
    silent?: boolean;
  } = {}
) => {
  const silent =
    (options.silent ?? false) || !(process.stdin.isTTY && process.stdout.isTTY);
  let spinner: ClackSpinner | undefined;
  // A silent run never renders, so it never loads the prompt stack.
  const getSpinner = () => (spinner ??= loadClackPrompts().spinner());

  return {
    start(nextText = text) {
      if (silent) {
        return;
      }
      getSpinner().start(nextText);
    },
    stop(nextText?: string) {
      if (silent) {
        return;
      }
      getSpinner().stop(nextText);
    },
    message(nextText: string) {
      if (silent) {
        return;
      }
      getSpinner().message(nextText);
    },
  };
};
