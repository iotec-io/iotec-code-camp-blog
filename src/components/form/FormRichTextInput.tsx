import { useEffect, useId, useRef } from 'react'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { RichTextEditor, Link as TiptapLinkExtension } from '@editorcn/editor'
import { BookOpen, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FormFieldHeader } from './FormFieldHeader'
import { FormFieldFeedback } from './FormFieldFeedback'

export interface FormRichTextInputProps {
  label: string
  value: string
  onChange: (html: string) => void
  required?: boolean
  placeholder?: string
  error?: string
  isZenMode?: boolean
  onToggleZenMode?: () => void
  containerClassName?: string
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function FormRichTextInput({
  label,
  value,
  onChange,
  required,
  placeholder = 'Begin drafting the archival monograph here. Use headings, blockquotes, code blocks, and lists to structure your thesis...',
  error,
  isZenMode = false,
  onToggleZenMode,
  containerClassName,
}: FormRichTextInputProps) {
  const feedbackId = useId()
  const hasError = Boolean(error)
  const lastEmittedHtmlRef = useRef<string>(value)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TiptapLinkExtension.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor: tiptapEditor }) => {
      const html = tiptapEditor.getHTML()
      lastEmittedHtmlRef.current = html
      onChange(html)
    },
  })

  // Sync external value changes (e.g. when hydrating an existing draft)
  useEffect(() => {
    if (
      editor &&
      !editor.isDestroyed &&
      value !== lastEmittedHtmlRef.current &&
      value !== editor.getHTML()
    ) {
      lastEmittedHtmlRef.current = value
      editor.commands.setContent(value)
    }
  }, [editor, value])

  const plainTextWords = stripHtmlToText(value)
    .split(/\s+/)
    .filter(Boolean).length
  const estimatedReadMin = Math.max(
    0.5,
    Number((plainTextWords / 200).toFixed(1)),
  )

  return (
    <div className={cn('w-full', containerClassName)}>
      <FormFieldHeader
        label={label}
        required={required}
        rightLabel={
          <span className="inline-flex items-center gap-2">
            <BookOpen aria-hidden="true" className="size-3" />
            <span>{plainTextWords} words</span>
            <span aria-hidden="true">&middot;</span>
            <span>~{estimatedReadMin} min read</span>
          </span>
        }
      />

      <div
        aria-invalid={hasError}
        aria-describedby={hasError ? feedbackId : undefined}
        className={cn(
          'mt-2 overflow-hidden rounded-xl border transition-colors',
          hasError
            ? 'border-destructive bg-red-50/20 ring-3 ring-destructive/20'
            : 'border-border bg-card/50',
        )}
      >
        <RichTextEditor
          editor={editor}
          className="border-0 bg-transparent shadow-none"
        >
          <RichTextEditor.Toolbar className="flex flex-wrap items-center justify-between gap-1 border-b border-border bg-card px-3 py-2">
            <div className="flex flex-wrap items-center gap-1">
              <RichTextEditor.ControlsGroup>
                <RichTextEditor.Bold />
                <RichTextEditor.Italic />
                <RichTextEditor.Underline />
                <RichTextEditor.Strikethrough />
              </RichTextEditor.ControlsGroup>

              <RichTextEditor.ControlsGroup>
                <RichTextEditor.H1 />
                <RichTextEditor.H2 />
                <RichTextEditor.H3 />
              </RichTextEditor.ControlsGroup>

              <RichTextEditor.ControlsGroup>
                <RichTextEditor.Blockquote />
                <RichTextEditor.Code />
                <RichTextEditor.CodeBlock />
              </RichTextEditor.ControlsGroup>

              <RichTextEditor.ControlsGroup>
                <RichTextEditor.BulletList />
                <RichTextEditor.OrderedList />
                <RichTextEditor.Link />
              </RichTextEditor.ControlsGroup>
            </div>

            {onToggleZenMode && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={onToggleZenMode}
                className="gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <Maximize2 aria-hidden="true" className="size-3" />
                <span>{isZenMode ? 'Exit Zen' : 'Zen'}</span>
              </Button>
            )}
          </RichTextEditor.Toolbar>

          <RichTextEditor.Content className="rich-text-content min-h-80 bg-card/30 px-6 py-5 text-sm focus-within:bg-white [&_.ProseMirror]:min-h-72 [&_.ProseMirror]:outline-none" />
        </RichTextEditor>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/80 bg-card/70 px-4 py-2.5 text-[11px] text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <span>Typography rhythm: 1.875rem line-height</span>
            <span aria-hidden="true">&middot;</span>
            <span>Semantic HTML Output Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-primary"
            />
            <span className="font-medium text-foreground">
              Nordic Serifs Active
            </span>
          </div>
        </div>
      </div>

      <FormFieldFeedback id={feedbackId} error={error} />
    </div>
  )
}
