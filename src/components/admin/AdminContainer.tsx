import React, { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { AdminTitle, type AdminTitleProps } from './AdminTitle'

export interface AdminContainerProps extends AdminTitleProps {
  children: ReactNode
  titleClassName?: string
}

export function AdminContainer({
  title,
  subtitle,
  buttons,
  children,
  className,
  titleClassName,
}: AdminContainerProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col',
        className,
      )}
    >
      <AdminTitle
        title={title}
        subtitle={subtitle}
        buttons={buttons}
        className={titleClassName}
      />
      {children}
    </div>
  )
}
