// demo.tsx
import React from 'react';
import Component from '@/components/ui/text-marque';

function CategoriesMarquee() {
  return (
    <>
      <div className='h-50 grid place-content-center'>
        <Component
          delay={500}
          baseVelocity={-3}
          clasname='font-bold tracking-[-0.07em] leading-[90%]'
        >
          Star the repo if you like it
        </Component>
        <Component
          delay={500}
          baseVelocity={3}
          clasname='font-bold tracking-[-0.07em] leading-[90%]'
        >
          Share it if you like it
        </Component>
      </div>
    </>
  );
}

export default CategoriesMarquee;