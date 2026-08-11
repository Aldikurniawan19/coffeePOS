import React from 'react';

/**
 * Brand Title Component formatted in "Cinzel" font without logo icon
 */
export default function BrandLogo({ size = 'md', className = '' }) {
  const isLarge = size === 'lg';

  return (
    <div className={`inline-flex items-center ${className}`}>
      <span className={`font-cinzel font-bold ${isLarge ? 'text-3xl' : 'text-2xl'} tracking-wider text-slate-900 leading-none select-none`}>
        Coffee <span className="text-blue-600 font-extrabold">POS</span>
      </span>
    </div>
  );
}
