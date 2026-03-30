import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, packageRepoUrl } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // JSX supported
      title: appName,
    },
    githubUrl: packageRepoUrl,
  };
}
