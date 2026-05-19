import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Circle, Eye, FileText, Upload, User } from 'lucide-react'
import dayjs from 'dayjs'
import { userApi } from '@/api/user'
import { provinceApi } from '@/api/province'
import { ensureFreshAccessToken } from '@/api/axios'
import { useAuthStore } from '@/stores/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import UploadPreviewDialog, { type UploadDialogSlot } from '@/components/common/UploadPreviewDialog'
import type { Province } from '@/types'

type DocumentDefinition = {
  key: string
  label: string
  note: string
  description: string
  slotDefinitions: { id: string; label: string; helperText?: string }[]
}

type PendingUpload = {
  key: string
  label: string
  description: string
  slots: UploadDialogSlot[]
} | null

const DOCUMENT_DEFINITIONS: DocumentDefinition[] = [
  {
    key: 'CCCD',
    label: 'Can cuoc cong dan',
    note: 'Hay tai len ca 2 mat cua CCCD',
    description: 'Hay tai len day du mat truoc va mat sau cua CCCD truoc khi xac nhan upload.',
    slotDefinitions: [
      { id: 'CCCD_FRONT', label: 'Mat truoc', helperText: 'Anh ro net, khong bi cat mep' },
      { id: 'CCCD_BACK', label: 'Mat sau', helperText: 'Anh ro net, thay day du thong tin' },
    ],
  },
  {
    key: 'HOUSEHOLD_REGISTRATION',
    label: 'So ho khau hoac Giay CT07',
    note: 'PDF, JPG, PNG',
    description: 'Chon tep giay to hop le de bo sung vao ho so.',
    slotDefinitions: [
      { id: 'HOUSEHOLD_REGISTRATION', label: 'Tep giay to' },
    ],
  },
  {
    key: 'RESIDENCE_CERTIFICATE',
    label: 'Giay xac nhan thuc trang nha o',
    note: 'Theo mau UBND xa/phuong cap',
    description: 'Chon tep giay to hop le de bo sung vao ho so.',
    slotDefinitions: [
      { id: 'RESIDENCE_CERTIFICATE', label: 'Tep giay to' },
    ],
  },
  {
    key: 'INCOME_CERTIFICATE',
    label: 'Giay xac nhan doi tuong va thu nhap',
    note: 'Co ky ten, dong dau cua co quan',
    description: 'Chon tep giay to hop le de bo sung vao ho so.',
    slotDefinitions: [
      { id: 'INCOME_CERTIFICATE', label: 'Tep giay to' },
    ],
  },
]

const inputCls = 'w-full px-4 py-3 bg-[#f3f4f5] rounded-xl outline-none focus:ring-2 focus:ring-[#115cb9] text-[#191c1d] text-sm'
const selectCls = inputCls
const OTHER_OPTION = 'Khac'

const OCCUPATION_OPTIONS = [
  'Cong chuc, vien chuc',
  'Cong nhan',
  'Giao vien',
  'Nhan vien van phong',
  'Kinh doanh tu do',
  'Lao dong tu do',
  'Noi tro',
  'Khac',
]

const PRIORITY_OPTIONS = [
  'Nguoi co cong voi cach mang',
  'Than nhan liet si',
  'Nguoi khuyet tat',
  'Nguoi duoc bo tri tai dinh cu theo hinh thuc mua NOXH',
  'Khong',
  'Khac',
]

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const [editing, setEditing] = useState(false)
  const [pendingUpload, setPendingUpload] = useState<PendingUpload>(null)
  const [uploadingLabel, setUploadingLabel] = useState<string | null>(null)
  const [occupationOption, setOccupationOption] = useState('')
  const [occupationOther, setOccupationOther] = useState('')
  const [priorityOption, setPriorityOption] = useState('')
  const [priorityOther, setPriorityOther] = useState('')
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<{ code: number; name: string }[]>([])
  const [wards, setWards] = useState<{ code: number; name: string }[]>([])
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('')
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('')
  const [selectedWardCode, setSelectedWardCode] = useState('')
  const [form, setForm] = useState({
    fullName: '',
    phoneNumber: '',
    cccdNumber: '',
    dateOfBirth: '',
    gender: '',
    permanentAddress: '',
    province: '',
    district: '',
    ward: '',
    currentAddress: '',
    occupation: '',
    incomePerMonth: '',
    householdSize: '',
    priorityCategory: '',
  })

  const { data: user, isLoading } = useQuery({
    queryKey: ['myInfo'],
    queryFn: () => userApi.getMyInfo().then((r) => r.data.result!),
  })

  const { data: userDocuments = [] } = useQuery({
    queryKey: ['userDocuments'],
    queryFn: () => userApi.getDocuments().then((r) => r.data.result || []),
  })

  const documentsByType = useMemo(
    () => new Map(userDocuments.map((doc) => [doc.documentType, doc])),
    [userDocuments]
  )

  useEffect(() => {
    provinceApi.getAll()
      .then((response) => {
        setProvinces((response.data.result as unknown as Province[]) || [])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedProvinceCode) {
      setDistricts([])
      setSelectedDistrictCode('')
      setWards([])
      setSelectedWardCode('')
      return
    }

    provinceApi.getDistricts(parseInt(selectedProvinceCode, 10))
      .then((response) => {
        const result = response.data.result as unknown as { districts?: { code: number; name: string }[] }
        setDistricts(result?.districts || [])
      })
      .catch(() => {
        setDistricts([])
      })
  }, [selectedProvinceCode])

  useEffect(() => {
    if (!selectedDistrictCode) {
      setWards([])
      setSelectedWardCode('')
      return
    }

    provinceApi.getWards(parseInt(selectedDistrictCode, 10))
      .then((response) => {
        const result = response.data.result as unknown as { wards?: { code: number; name: string }[] }
        setWards(result?.wards || [])
      })
      .catch(() => {
        setWards([])
      })
  }, [selectedDistrictCode])

  useEffect(() => {
    if (!user) return
    setForm({
      fullName: user.fullName || '',
      phoneNumber: user.phoneNumber || '',
      cccdNumber: user.cccdNumber || '',
      dateOfBirth: user.dateOfBirth || '',
      gender: user.gender || '',
      permanentAddress: user.permanentAddress || '',
      province: user.province || '',
      district: user.district || '',
      ward: user.ward || '',
      currentAddress: user.currentAddress || '',
      occupation: user.occupation || '',
      incomePerMonth: user.incomePerMonth?.toString() || '',
      householdSize: user.householdSize?.toString() || '',
      priorityCategory: user.priorityCategory || '',
    })

    const matchedOccupation = OCCUPATION_OPTIONS.find((option) => option === user.occupation && option !== OTHER_OPTION)
    setOccupationOption(matchedOccupation || (user.occupation ? OTHER_OPTION : ''))
    setOccupationOther(matchedOccupation ? '' : (user.occupation || ''))

    const matchedPriority = PRIORITY_OPTIONS.find((option) => option === user.priorityCategory && option !== OTHER_OPTION)
    setPriorityOption(matchedPriority || (user.priorityCategory ? OTHER_OPTION : ''))
    setPriorityOther(matchedPriority ? '' : (user.priorityCategory || ''))

    const provinceMatch = provinces.find((province) => province.name === (user.province || ''))
    if (provinceMatch) {
      setSelectedProvinceCode(String(provinceMatch.code))
    }

    setUser(user)
  }, [provinces, setUser, user])

  useEffect(() => {
    if (!user?.district || !districts.length) return
    const districtMatch = districts.find((district) => district.name === user.district)
    if (districtMatch) {
      setSelectedDistrictCode(String(districtMatch.code))
    }
  }, [districts, user?.district])

  useEffect(() => {
    if (!user?.ward || !wards.length) return
    const wardMatch = wards.find((ward) => ward.name === user.ward)
    if (wardMatch) {
      setSelectedWardCode(String(wardMatch.code))
    }
  }, [user?.ward, wards])

  const updateMutation = useMutation({
    mutationFn: () => {
      const provinceName = provinces.find((province) => String(province.code) === selectedProvinceCode)?.name
      const districtName = districts.find((district) => String(district.code) === selectedDistrictCode)?.name
      const wardName = wards.find((ward) => String(ward.code) === selectedWardCode)?.name
      const occupationValue = occupationOption === OTHER_OPTION ? occupationOther.trim() : occupationOption
      const priorityValue = priorityOption === OTHER_OPTION ? priorityOther.trim() : priorityOption

      return userApi.updateProfile({
        fullName: form.fullName,
        phoneNumber: form.phoneNumber || undefined,
        cccdNumber: form.cccdNumber || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        permanentAddress: form.permanentAddress || undefined,
        province: provinceName || undefined,
        district: districtName || undefined,
        ward: wardName || undefined,
        currentAddress: form.currentAddress || undefined,
        occupation: occupationValue || undefined,
        incomePerMonth: form.incomePerMonth ? parseInt(form.incomePerMonth, 10) : undefined,
        householdSize: form.householdSize ? parseInt(form.householdSize, 10) : undefined,
        priorityCategory: priorityValue || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myInfo'] })
      toast.success('Cap nhat thong tin thanh cong')
      setEditing(false)
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(message || 'Cap nhat thong tin that bai')
    },
  })

  const completedDocumentCount = DOCUMENT_DEFINITIONS.filter((document) => {
    return document.slotDefinitions.every((slot) => documentsByType.has(slot.id))
  }).length

  const openUploadDialog = (document: DocumentDefinition) => {
    setPendingUpload({
      key: document.key,
      label: document.label,
      description: document.description,
      slots: document.slotDefinitions.map((slot) => ({
        id: slot.id,
        label: slot.label,
        helperText: slot.helperText,
        file: null,
      })),
    })
  }

  const closeUploadDialog = () => {
    if (uploadingLabel) return
    setPendingUpload(null)
  }

  const updatePendingFile = (slotId: string, file: File | null) => {
    setPendingUpload((current) => {
      if (!current) return current
      return {
        ...current,
        slots: current.slots.map((slot) => (
          slot.id === slotId ? { ...slot, file } : slot
        )),
      }
    })
  }

  const confirmUpload = async () => {
    if (!pendingUpload) return
    const uploadSlots = pendingUpload.slots.map((slot) => ({
      id: slot.id,
      label: slot.label,
      file: slot.file,
    }))
    let currentUploadLabel = ''

    const missingSlot = uploadSlots.find((slot) => !slot.file)
    if (missingSlot) {
      toast.error(`Vui long chon tep cho ${missingSlot.label.toLowerCase()}`)
      return
    }

    try {
      await ensureFreshAccessToken()

      for (const slot of uploadSlots) {
        currentUploadLabel = `${pendingUpload.label} - ${slot.label}`
        setUploadingLabel(currentUploadLabel)
        await userApi.uploadDocument(slot.id, slot.file as File)
      }

      await queryClient.invalidateQueries({ queryKey: ['userDocuments'] })
      toast.success('Upload giay to thanh cong')
      setPendingUpload(null)
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(message || `Upload that bai o muc ${currentUploadLabel || 'dang tai'}`)
    } finally {
      setUploadingLabel(null)
    }
  }

  const submitDocumentsMutation = useMutation({
    mutationFn: async () => true,
    onSuccess: () => {
      toast.info('Tinh nang nop ho so se duoc ket noi sau khi luong admin san sang.')
      navigate('/dashboard')
    },
  })

  if (isLoading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
      <UploadPreviewDialog
        open={Boolean(pendingUpload)}
        title={pendingUpload ? `Upload ${pendingUpload.label}` : 'Upload giay to'}
        description={pendingUpload?.description || 'Chon tep va xac nhan upload.'}
        slots={pendingUpload?.slots || []}
        loading={Boolean(uploadingLabel)}
        confirmDisabled={!pendingUpload || pendingUpload.slots.some((slot) => !slot.file)}
        confirmLabel={uploadingLabel ? `Dang tai ${uploadingLabel}...` : 'Xac nhan upload'}
        onClose={closeUploadDialog}
        onFileChange={updatePendingFile}
        onConfirm={confirmUpload}
      />

      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-[#001f49] mb-3">Ho so cong dan</h1>
        <p className="text-[#44474e] max-w-3xl">
          Bo sung thong tin ca nhan va tai day du giay to de hoan thien ho so cua ban.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#001f49] flex items-center gap-2">
                <User size={22} className="text-[#115cb9]" /> Thong tin ca nhan
              </h2>
              <button
                type="button"
                onClick={() => setEditing((current) => !current)}
                className="px-4 py-2 bg-[#f3f4f5] text-[#001f49] rounded-xl text-sm font-bold hover:bg-[#edeeef] transition-colors"
              >
                {editing ? 'Huy' : 'Chinh sua'}
              </button>
            </div>

            {editing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'fullName', label: 'Ho va ten', type: 'text' },
                  { key: 'phoneNumber', label: 'So dien thoai', type: 'tel' },
                  { key: 'cccdNumber', label: 'So CCCD', type: 'text' },
                  { key: 'dateOfBirth', label: 'Ngay sinh', type: 'date' },
                  { key: 'gender', label: 'Gioi tinh', type: 'text' },
                  { key: 'incomePerMonth', label: 'Thu nhap / thang', type: 'number' },
                  { key: 'householdSize', label: 'So nhan khau', type: 'number' },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-[#44474e] uppercase mb-1">{label}</label>
                    <input
                      type={type}
                      value={form[key as keyof typeof form]}
                      onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                      className={inputCls}
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-bold text-[#44474e] uppercase mb-1">Nghe nghiep</label>
                  <select
                    value={occupationOption}
                    onChange={(event) => {
                      const value = event.target.value
                      setOccupationOption(value)
                      if (value !== OTHER_OPTION) {
                        setOccupationOther('')
                      }
                    }}
                    className={selectCls}
                  >
                    <option value="">Chon nghe nghiep</option>
                    {OCCUPATION_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                {occupationOption === OTHER_OPTION && (
                  <div>
                    <label className="block text-xs font-bold text-[#44474e] uppercase mb-1">Nhap nghe nghiep khac</label>
                    <input
                      type="text"
                      value={occupationOther}
                      onChange={(event) => setOccupationOther(event.target.value)}
                      className={inputCls}
                    />
                  </div>
                )}

                <div className={occupationOption === OTHER_OPTION ? '' : ''}>
                  <label className="block text-xs font-bold text-[#44474e] uppercase mb-1">Doi tuong uu tien</label>
                  <select
                    value={priorityOption}
                    onChange={(event) => {
                      const value = event.target.value
                      setPriorityOption(value)
                      if (value !== OTHER_OPTION) {
                        setPriorityOther('')
                      }
                    }}
                    className={selectCls}
                  >
                    <option value="">Chon doi tuong</option>
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                {priorityOption === OTHER_OPTION && (
                  <div>
                    <label className="block text-xs font-bold text-[#44474e] uppercase mb-1">Nhap doi tuong khac</label>
                    <input
                      type="text"
                      value={priorityOther}
                      onChange={(event) => setPriorityOther(event.target.value)}
                      className={inputCls}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#44474e] uppercase mb-1">Tinh / Thanh</label>
                  <select
                    value={selectedProvinceCode}
                    onChange={(event) => {
                      setSelectedProvinceCode(event.target.value)
                      setSelectedDistrictCode('')
                      setSelectedWardCode('')
                    }}
                    className={selectCls}
                  >
                    <option value="">Chon tinh / thanh</option>
                    {provinces.map((province) => (
                      <option key={province.code} value={province.code}>{province.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#44474e] uppercase mb-1">Quan / Huyen</label>
                  <select
                    value={selectedDistrictCode}
                    onChange={(event) => {
                      setSelectedDistrictCode(event.target.value)
                      setSelectedWardCode('')
                    }}
                    disabled={!selectedProvinceCode}
                    className={selectCls}
                  >
                    <option value="">Chon quan / huyen</option>
                    {districts.map((district) => (
                      <option key={district.code} value={district.code}>{district.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#44474e] uppercase mb-1">Phuong / Xa</label>
                  <select
                    value={selectedWardCode}
                    onChange={(event) => setSelectedWardCode(event.target.value)}
                    disabled={!selectedDistrictCode}
                    className={selectCls}
                  >
                    <option value="">Chon phuong / xa</option>
                    {wards.map((ward) => (
                      <option key={ward.code} value={ward.code}>{ward.name}</option>
                    ))}
                  </select>
                </div>

                {[
                  { key: 'permanentAddress', label: 'Dia chi thuong tru' },
                  { key: 'currentAddress', label: 'Dia chi hien tai' },
                ].map(({ key, label }) => (
                  <div key={key} className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#44474e] uppercase mb-1">{label}</label>
                    <input
                      type="text"
                      value={form[key as keyof typeof form]}
                      onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                      className={inputCls}
                    />
                  </div>
                ))}

                <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-6 py-2 text-[#001f49] font-bold hover:bg-[#f3f4f5] rounded-xl transition-colors text-sm"
                  >
                    Huy
                  </button>
                  <button
                    type="button"
                    onClick={() => updateMutation.mutate()}
                    disabled={updateMutation.isPending}
                    className="px-8 py-2 bg-[#001f49] text-white rounded-xl font-bold text-sm hover:bg-[#115cb9] transition-colors disabled:opacity-70"
                  >
                    {updateMutation.isPending ? 'Dang luu...' : 'Luu thay doi'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Ho va ten', value: user?.fullName },
                  { label: 'Email', value: user?.email },
                  { label: 'So dien thoai', value: user?.phoneNumber || '-' },
                  { label: 'So CCCD', value: user?.cccdNumber || '-' },
                  { label: 'Ngay sinh', value: user?.dateOfBirth ? dayjs(user.dateOfBirth).format('DD/MM/YYYY') : '-' },
                  { label: 'Gioi tinh', value: user?.gender || '-' },
                  { label: 'Nghe nghiep', value: user?.occupation || '-' },
                  { label: 'Thu nhap / thang', value: user?.incomePerMonth ? `${user.incomePerMonth.toLocaleString()} VND` : '-' },
                  { label: 'So nhan khau', value: user?.householdSize?.toString() || '-' },
                  { label: 'Doi tuong uu tien', value: user?.priorityCategory || '-' },
                  { label: 'Tinh / Thanh', value: user?.province || '-' },
                  { label: 'Quan / Huyen', value: user?.district || '-' },
                  { label: 'Phuong / Xa', value: user?.ward || '-' },
                  { label: 'Dia chi thuong tru', value: user?.permanentAddress || '-' },
                  { label: 'Dia chi hien tai', value: user?.currentAddress || '-' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-bold text-[#44474e] uppercase mb-1">{label}</p>
                    <p className="text-[#191c1d] font-medium break-words">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div id="documents" className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-[#001f49] flex items-center gap-2">
                <FileText size={22} className="text-[#115cb9]" /> Danh muc ho so dinh kem
              </h2>
              <div className="text-right">
                <p className="text-xs font-bold text-[#44474e] uppercase">Tien do</p>
                <p className="text-xl font-black text-[#001f49]">{completedDocumentCount} / {DOCUMENT_DEFINITIONS.length}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#f3f4f5]">
              <div className="grid grid-cols-12 px-4 py-3 bg-[#edeeef] text-[10px] font-bold text-[#44474e] uppercase tracking-widest">
                <div className="col-span-5">Loai giay to</div>
                <div className="col-span-3">Trang thai</div>
                <div className="col-span-4 text-right">Thao tac</div>
              </div>

              {DOCUMENT_DEFINITIONS.map((document) => {
                const uploadedSlots = document.slotDefinitions
                  .map((slot) => documentsByType.get(slot.id))
                  .filter(Boolean)
                const isComplete = uploadedSlots.length === document.slotDefinitions.length
                const hasAnyFile = uploadedSlots.length > 0
                const status = isComplete ? 'DA NOP' : hasAnyFile ? 'THIEU TEP' : 'CHUA NOP'

                return (
                  <div key={document.key} className="grid grid-cols-12 px-4 py-4 items-center border-b border-[#f3f4f5] hover:bg-[#f3f4f5] transition-colors">
                    <div className="col-span-5">
                      <p className="text-sm font-semibold text-[#001f49]">{document.label}</p>
                      <p className="text-[10px] text-[#44474e]">{document.note}</p>
                    </div>

                    <div className="col-span-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${
                        isComplete
                          ? 'bg-[#d6e3ff] text-[#3f5881]'
                          : hasAnyFile
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-[#edeeef] text-[#44474e]'
                      }`}>
                        <Circle size={6} className={`${
                          isComplete
                            ? 'fill-[#465f88]'
                            : hasAnyFile
                              ? 'fill-[#d97706]'
                              : 'fill-[#c4c6cf]'
                        }`} />
                        {status}
                      </span>
                    </div>

                    <div className="col-span-4 flex justify-end gap-2 flex-wrap">
                      {document.slotDefinitions.map((slot) => {
                        const uploaded = documentsByType.get(slot.id)
                        if (!uploaded) return null
                        return (
                          <a
                            key={slot.id}
                            href={uploaded.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-white rounded-lg text-xs font-bold text-[#001f49] border border-[#e1e3e4] hover:bg-[#f8f9fa] transition-all inline-flex items-center gap-1.5"
                          >
                            <Eye size={14} />
                            {document.key === 'CCCD' ? slot.label : 'Xem'}
                          </a>
                        )
                      })}

                      <button
                        type="button"
                        onClick={() => openUploadDialog(document)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          hasAnyFile
                            ? 'bg-[#e1e3e4] text-[#001f49] hover:bg-white'
                            : 'bg-[#115cb9] text-white hover:opacity-90'
                        }`}
                      >
                        <Upload size={14} />
                        {hasAnyFile ? 'Tai lai' : 'Upload'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => submitDocumentsMutation.mutate()}
                disabled={submitDocumentsMutation.isPending}
                className="px-8 py-3 bg-[#001f49] text-white rounded-xl font-bold text-sm hover:bg-[#115cb9] transition-colors disabled:opacity-70"
              >
                {submitDocumentsMutation.isPending ? 'Dang xu ly...' : 'Nop ho so'}
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-[#001f49] mb-4">Huong dan hoan thien ho so</h3>
            <div className="rounded-xl bg-[#f3f4f5] p-4 text-sm text-[#44474e] leading-relaxed">
              Dien day du thong tin ca nhan, sau do tai CCCD va 3 loai giay to bat buoc de hoan thien ho so.
            </div>
          </div>

          <div className="bg-[#001f49] text-white p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-2">Trang thai hien tai</h3>
            <p className="text-sm text-blue-100 leading-relaxed">
              Luong nop ho so len admin chua duoc ket noi.
              Ban co the chuan bi du lieu va giay to tren man hinh nay truoc.
            </p>
            <Link
              to="/dashboard"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
            >
              Quay lai dashboard
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
