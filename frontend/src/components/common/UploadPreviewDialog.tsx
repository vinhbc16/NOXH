import { useEffect, useMemo, useRef, useState } from 'react'
import { Eye, FileImage, FileText, Upload, X } from 'lucide-react'

export interface UploadDialogSlot {
  id: string
  label: string
  file: File | null
  helperText?: string
}

interface UploadPreviewDialogProps {
  open: boolean
  title: string
  description: string
  slots: UploadDialogSlot[]
  loading?: boolean
  confirmDisabled?: boolean
  confirmLabel?: string
  onClose: () => void
  onFileChange: (slotId: string, file: File | null) => void
  onConfirm: () => void
}

const accept = 'image/*,.pdf'

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadPreviewDialog({
  open,
  title,
  description,
  slots,
  loading = false,
  confirmDisabled = false,
  confirmLabel = 'Xac nhan upload',
  onClose,
  onFileChange,
  onConfirm,
}: UploadPreviewDialogProps) {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [activeSlotId, setActiveSlotId] = useState<string | null>(slots[0]?.id ?? null)
  const activeSlot = slots.find((slot) => slot.id === activeSlotId) ?? slots[0]
  const activeFile = activeSlot?.file ?? null
  const previewUrl = useMemo(() => (activeFile ? URL.createObjectURL(activeFile) : null), [activeFile])

  useEffect(() => {
    if (!open) return
    const preferredSlotId = slots.find((slot) => slot.file)?.id ?? slots[0]?.id ?? null
    if (!activeSlotId || !slots.some((slot) => slot.id === activeSlotId)) {
      setActiveSlotId(preferredSlotId)
    }
  }, [activeSlotId, open, slots])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  if (!open) return null

  const isPdf = activeFile?.type === 'application/pdf'
  const isImage = Boolean(activeFile?.type.startsWith('image/'))

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#001f49]/45 p-3 sm:p-6">
      <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:max-h-[calc(100vh-3rem)]">
        <div className="flex shrink-0 items-start justify-between border-b border-[#e1e3e4] px-5 py-4 sm:px-6">
          <div className="space-y-1 pr-4">
            <h3 className="text-lg font-bold text-[#001f49]">{title}</h3>
            <p className="text-sm text-[#44474e]">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#44474e] transition-colors hover:bg-[#f3f4f5] hover:text-[#001f49]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-6 overflow-hidden px-5 py-5 md:grid-cols-[320px_minmax(0,1fr)] md:px-6 md:py-6">
          <section className="space-y-4 overflow-y-auto pr-1">
            {slots.map((slot) => {
              const slotIsPdf = slot.file?.type === 'application/pdf'
              return (
                <div
                  key={slot.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    activeSlot?.id === slot.id ? 'border-[#115cb9] bg-[#eef4ff]' : 'border-[#e1e3e4] bg-[#f8f9fa]'
                  }`}
                >
                  <input
                    ref={(element) => {
                      inputRefs.current[slot.id] = element
                    }}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={(event) => {
                      const selected = event.target.files?.[0] ?? null
                      onFileChange(slot.id, selected)
                      if (selected) setActiveSlotId(slot.id)
                    }}
                  />

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-[#001f49]">{slot.label}</h4>
                      {slot.helperText && <p className="mt-1 text-xs text-[#44474e]">{slot.helperText}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSlotId(slot.id)}
                      className="rounded-lg px-2 py-1 text-xs font-bold text-[#115cb9] transition-colors hover:bg-white"
                    >
                      Xem
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => inputRefs.current[slot.id]?.click()}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#115cb9] px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                  >
                    <Upload size={16} />
                    {slot.file ? 'Chon tep khac' : 'Chon tep tai len'}
                  </button>

                  <div className="mt-3 rounded-lg bg-white p-3 text-sm text-[#191c1d]">
                    {slot.file ? (
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-[#001f49]">
                          {slotIsPdf ? <FileText size={18} /> : <FileImage size={18} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="break-words font-semibold text-[#001f49]">{slot.file.name}</p>
                          <p className="mt-1 text-xs text-[#44474e]">{formatFileSize(slot.file.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onFileChange(slot.id, null)
                            const input = inputRefs.current[slot.id]
                            if (input) input.value = ''
                          }}
                          className="rounded-full p-1 text-[#74777f] transition-colors hover:bg-[#f3f4f5] hover:text-[#001f49]"
                          title="Xoa tep"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-[#44474e]">Chua chon tep nao.</p>
                    )}
                  </div>
                </div>
              )
            })}
          </section>

          <section className="flex min-h-0 flex-col space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#001f49]">
              <Eye size={16} />
              Xem truoc
            </div>
            <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-[#e1e3e4] bg-[#f8f9fa] p-3">
              {!activeFile && (
                <div className="flex h-full min-h-[280px] items-center justify-center text-center text-sm text-[#44474e]">
                  Chon tep de xem truoc truoc khi tai len.
                </div>
              )}

              {activeFile && isImage && previewUrl && (
                <div className="flex min-h-full items-center justify-center">
                  <img
                    src={previewUrl}
                    alt={activeFile.name}
                    className="h-auto max-h-full w-auto max-w-full rounded-lg object-contain"
                  />
                </div>
              )}

              {activeFile && isPdf && previewUrl && (
                <iframe
                  title={activeFile.name}
                  src={previewUrl}
                  className="h-[60vh] min-h-[320px] w-full rounded-lg bg-white"
                />
              )}

              {activeFile && !isImage && !isPdf && (
                <div className="flex h-full min-h-[280px] items-center justify-center text-center text-sm text-[#44474e]">
                  Khong the xem truoc dinh dang nay trong trinh duyet.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-[#e1e3e4] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-bold text-[#001f49] transition-colors hover:bg-[#f3f4f5]"
          >
            Huy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled || loading}
            className="rounded-lg bg-[#115cb9] px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Dang tai len...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
