'use client';

import {MotionConfig} from 'framer-motion';
import type {ReactNode} from 'react';

/**
 * Global framer-motion policy. `reducedMotion="user"` makes every
 * motion component honor the OS prefers-reduced-motion setting (transform
 * and layout animations are disabled), which replaces the old universal CSS
 * clip that fought with framer's animation engine.
 */
export default function MotionProvider({children}: {children: ReactNode}) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
