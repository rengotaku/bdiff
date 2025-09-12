import React from 'react'
import { Button, type ButtonProps } from './Button'
import { cn } from '../../utils/cn'

// Copy icon SVG
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={cn("w-4 h-4", className)} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
    />
  </svg>
)

// Success checkmark icon SVG
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={cn("w-4 h-4", className)} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M5 13l4 4L19 7" 
    />
  </svg>
)

export interface CopyButtonProps extends Omit<ButtonProps, 'leftIcon' | 'children'> {
  /**
   * Whether the copy operation was successful (shows check icon temporarily)
   */
  copied?: boolean
  
  /**
   * Text to display on the button
   */
  label?: string
  
  /**
   * Show only icon without text (compact mode)
   */
  iconOnly?: boolean
  
  /**
   * Custom copy icon
   */
  copyIcon?: React.ReactNode
  
  /**
   * Custom success icon
   */
  successIcon?: React.ReactNode
  
  /**
   * Tooltip text when hovering
   */
  tooltip?: string
}

export const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  ({ 
    copied = false,
    label = 'コピー',
    iconOnly = false,
    copyIcon = <CopyIcon />,
    successIcon = <CheckIcon />,
    tooltip,
    variant = 'ghost',
    size = 'sm',
    className,
    disabled,
    loading,
    ...props 
  }, ref) => {
    const buttonContent = () => {
      if (loading) {
        return iconOnly ? null : 'コピー中...'
      }
      
      if (copied) {
        return iconOnly ? null : 'コピー済み'
      }
      
      return iconOnly ? null : label
    }

    const buttonIcon = () => {
      if (loading) {
        return null // Loading state handled by Button component
      }
      
      if (copied) {
        return successIcon
      }
      
      return copyIcon
    }

    return (
      <Button
        ref={ref}
        variant={variant}
        size={iconOnly ? 'icon' : size}
        className={cn(
          // Base styles
          'transition-all duration-200',
          // Success state styling
          copied && [
            'text-green-600 border-green-200 bg-green-50',
            'hover:bg-green-100 hover:border-green-300'
          ],
          // Custom className
          className
        )}
        leftIcon={buttonIcon()}
        disabled={disabled || copied}
        loading={loading}
        title={tooltip}
        aria-label={iconOnly ? (copied ? 'コピー済み' : label) : undefined}
        {...props}
      >
        {buttonContent()}
      </Button>
    )
  }
)

CopyButton.displayName = 'CopyButton'

// Variants for different copy types
export const CopyAllButton = React.forwardRef<HTMLButtonElement, Omit<CopyButtonProps, 'label'>>(
  (props, ref) => (
    <CopyButton 
      ref={ref} 
      label="全てコピー" 
      tooltip="差分全体をクリップボードにコピー"
      {...props} 
    />
  )
)
CopyAllButton.displayName = 'CopyAllButton'

export const CopyAddedButton = React.forwardRef<HTMLButtonElement, Omit<CopyButtonProps, 'label'>>(
  (props, ref) => (
    <CopyButton 
      ref={ref} 
      label="追加のみ" 
      tooltip="追加行のみをクリップボードにコピー"
      {...props} 
    />
  )
)
CopyAddedButton.displayName = 'CopyAddedButton'

export const CopyRemovedButton = React.forwardRef<HTMLButtonElement, Omit<CopyButtonProps, 'label'>>(
  (props, ref) => (
    <CopyButton 
      ref={ref} 
      label="削除のみ" 
      tooltip="削除行のみをクリップボードにコピー"
      {...props} 
    />
  )
)
CopyRemovedButton.displayName = 'CopyRemovedButton'

export const CopyChangedButton = React.forwardRef<HTMLButtonElement, Omit<CopyButtonProps, 'label'>>(
  (props, ref) => (
    <CopyButton 
      ref={ref} 
      label="変更のみ" 
      tooltip="変更行のみをクリップボードにコピー"
      {...props} 
    />
  )
)
CopyChangedButton.displayName = 'CopyChangedButton'

export const CopyLineButton = React.forwardRef<HTMLButtonElement, Omit<CopyButtonProps, 'label' | 'iconOnly'>>(
  (props, ref) => (
    <CopyButton 
      ref={ref} 
      label="行をコピー" 
      iconOnly={true}
      tooltip="この行をクリップボードにコピー"
      size="icon"
      className="opacity-0 group-hover:opacity-100 transition-opacity"
      {...props} 
    />
  )
)
CopyLineButton.displayName = 'CopyLineButton'