/* eslint-disable react/display-name */

import { css } from '@emotion/react';
import { ForwardedRef, HTMLAttributes, forwardRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store/store';

const Card = forwardRef(
  (
    { children, ...props }: HTMLAttributes<HTMLElement>,
    ref: ForwardedRef<HTMLElement>,
  ) => {
    const cardColor = useSelector((state: RootState) => state.color.cardColor);

    return (
      <article
        css={css`
          margin: 0 auto;
          margin-top: 0.375rem;
          padding: 0.375rem;
          width: calc(100% - 12px);
          max-width: 42.375rem;
          height: calc(100% - (var(--card-margin) * 2));
          background: ${cardColor};
          border-radius: 1.25rem;
          display: flex;
          flex-direction: column;
          justify-content: space-evenly;
          align-items: center;
          transition: background 1.5s;

          position: relative;

          &:first-of-type {
            margin-top: var(--card-margin);
          }
        `}
        ref={ref}
        {...props}
      >
        {children}
      </article>
    );
  },
);

export default Card;
