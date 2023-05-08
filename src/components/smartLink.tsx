import React from 'react';
import {Link} from 'gatsby';

import {marketingUrlParams} from '../utils';

import ExternalLink from './externalLink';

type Props = {
  activeClassName?: string;
  children?: React.ReactNode;
  className?: string;
  href?: string;
  isActive?: boolean;
  remote?: boolean;
  target?: string;
  title?: string;
  to?: string;
};

export default function SmartLink({
  to,
  href,
  children,
  activeClassName = 'active',
  remote = false,
  className = '',
  isActive,
  ...props
}: Props): JSX.Element {
  const realTo = to || href || '';

  const [forcedUrl, setForcedUrl] = React.useState(realTo);

  // Google Tag Manager syncs certain query parameters to all links on the page.
  // Since Gatsby's Link is a React component, it doesn't catch these updates
  // because they're made outside of React, so we keep track of them ourselves.
  React.useEffect(() => {
    const marketingParams = marketingUrlParams();
    if (Object.keys(marketingParams).length === 0) {
      return;
    }
    const urlObj = new URL(realTo, window.location.origin);
    // update params
    for (const [key, value] of Object.entries(marketingParams)) {
      // Merge the new params *before* the old to ensure the old ones
      // don't get clobbered. If they're set, they should stay.
      if (!urlObj.searchParams.has(key)) {
        urlObj.searchParams.set(key, value);
      }
    }
    setForcedUrl(urlObj.toString());
  }, [realTo]);

  if (realTo.indexOf('://') !== -1) {
    return (
      <ExternalLink href={realTo} className={className} {...props}>
        {children || to || href}
      </ExternalLink>
    );
  }
  if (
    // this handles cases like anchor tags (where Link messes thats up)
    realTo.indexOf('/') !== 0 ||
    remote ||
    // target-blank links are typically links to images, where Link doesn't
    // work either. Those links are generated by gatsby-remark-images only, but
    // since this component is overwriting all <a> tags, Link messes that up
    // too.
    //
    // In any case, any target=_blank link doesn't work with Link, so this is
    // not just some heuristic to find images, but *also* just the right thing
    // to do for those types of links.
    //
    // See https://github.com/getsentry/sentry-docs/issues/3152 for more info.
    props.target === '_blank'
  ) {
    return (
      <a href={realTo} className={className} {...props}>
        {children || to || href}
      </a>
    );
  }

  return (
    <Link
      to={forcedUrl ?? realTo}
      activeClassName={activeClassName}
      // We need to manually set class to active because Gatsby doesn't highlight correclty with the original_referrer query param
      className={isActive ? activeClassName : className}
      {...props}
    >
      {children || to || href}
    </Link>
  );
}
