import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Camera, CheckCircle, ChevronRight, FileText, Scan, UploadCloud } from 'lucide-react'
import { provinceApi } from '@/api/province'
import { userApi } from '@/api/user'
import { useAuthStore } from '@/stores/authStore'
import type { Province } from '@/types'

const schema = z.object({
  fullName: z.string().min(2, 'Họ tên không hợp lệ'),
  cccdNumber: z.string().min(9, 'Số CCCD không hợp lệ'),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  permanentAddress: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  ward: z.string().optional(),
  occupation: z.string().optional(),
  incomePerMonth: z.string().optional(),
  householdSize: z.string().optional(),
  priorityCategory: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const steps = [
  { num: 1, label: 'Chụp CCCD', icon: Camera },
  { num: 2, label: 'Chân dung', icon: Scan },
  { num: 3, label: 'Xác nhận OCR', icon: FileText },
]

const inputCls = 'w-full px-4 py-3 bg-[#f3f4f5] rounded-xl outline-none focus:ring-2 focus:ring-[#115cb9] text-[#191c1d] text-sm'
const selectCls = inputCls

function FileDrop({
  id,
  label,
  file,
  onChange,
  square,
}: {
  id: string
  label: string
  file: File | null
  onChange: (file: File) => void
  square?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-[#001f49] mb-3">{label}</label>
      <label
        htmlFor={id}
        className={`${square ? 'aspect-square max-w-xs mx-auto' : 'aspect-[1.6/1] w-full'} border-2 border-dashed border-[#c4c6cf] rounded-xl flex flex-col items-center justify-center bg-[#f3f4f5] cursor-pointer hover:bg-[#edeeef] transition-colors px-4 text-center`}
      >
        {file ? (
          <CheckCircle size={38} className="text-green-600 mb-3" />
        ) : (
          <Camera size={38} className="text-[#115cb9] mb-3" />
        )}
        <p className="text-sm font-semibold text-[#001f49]">
          {file ? file.name : 'Bấm để chụp hoặc tải lên'}
        </p>
        <p className="text-xs text-[#44474e] mt-1">Hỗ trợ JPG, PNG, PDF</p>
      </label>
      <input
        id={id}
        type="file"
        accept="image/*,.pdf"
        capture={square ? 'user' : undefined}
        className="hidden"
        onChange={(event) => {
          const selected = event.target.files?.[0]
          if (selected) onChange(selected)
        }}
      />
    </div>
  )
}

export default function KycPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploadingLabel, setUploadingLabel] = useState<string | null>(null)
  const [cccdFront, setCccdFront] = useState<File | null>(null)
  const [cccdBack, setCccdBack] = useState<File | null>(null)
  const [portrait, setPortrait] = useState<File | null>(null)
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<{ code: number; name: string }[]>([])
  const [wards, setWards] = useState<{ code: number; name: string }[]>([])
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const selectedProvince = watch('province')
  const selectedDistrict = watch('district')

  useEffect(() => {
    provinceApi.getAll().then((res) => {
      setProvinces((res.data.result as unknown as Province[]) || [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (selectedProvince) {
      provinceApi.getDistricts(parseInt(selectedProvince)).then((res) => {
        const data = res.data.result as unknown as { districts?: { code: number; name: string }[] }
        setDistricts(data?.districts || [])
        setWards([])
      }).catch(() => {})
    }
  }, [selectedProvince])

  useEffect(() => {
    if (selectedDistrict) {
      provinceApi.getWards(parseInt(selectedDistrict)).then((res) => {
        const data = res.data.result as unknown as { wards?: { code: number; name: string }[] }
        setWards(data?.wards || [])
      }).catch(() => {})
    }
  }, [selectedDistrict])

  const goToPortrait = () => {
    if (!cccdFront || !cccdBack) {
      toast.error('Vui lòng tải lên đủ mặt trước và mặt sau CCCD')
      return
    }
    setStep(2)
  }

  const goToConfirm = () => {
    if (!portrait) {
      toast.error('Vui lòng tải lên ảnh chân dung')
      return
    }
    setStep(3)
  }

  const uploadIdentityFile = async (label: string, file: File) => {
    setUploadingLabel(label)
    const response = await userApi.uploadFile(file)
    const result = response.data.result
    if (!result?.url) {
      throw new Error(`Missing uploaded URL for ${label}`)
    }
    return result
  }

  const onSubmit = async (data: FormData) => {
    if (!cccdFront || !cccdBack || !portrait) {
      toast.error('Vui lòng hoàn tất 3 bước xác thực')
      return
    }

    setLoading(true)
    try {
      const frontUpload = await uploadIdentityFile('CCCD mat truoc', cccdFront)
      const backUpload = await uploadIdentityFile('CCCD mat sau', cccdBack)
      const portraitUpload = await uploadIdentityFile('anh chan dung', portrait)
      const provinceObj = provinces.find((p) => p.code === parseInt(data.province || '0'))
      const districtObj = districts.find((d) => d.code === parseInt(data.district || '0'))
      const wardObj = wards.find((w) => w.code === parseInt(data.ward || '0'))

      const res = await userApi.submitKyc({
        fullName: data.fullName,
        cccdNumber: data.cccdNumber,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        permanentAddress: data.permanentAddress,
        province: provinceObj?.name || data.province,
        district: districtObj?.name || data.district,
        ward: wardObj?.name || data.ward,
        occupation: data.occupation,
        incomePerMonth: data.incomePerMonth ? parseInt(data.incomePerMonth) : undefined,
        householdSize: data.householdSize ? parseInt(data.householdSize) : undefined,
        priorityCategory: data.priorityCategory,
        cccdFrontUrl: frontUpload.url,
        cccdBackUrl: backUpload.url,
        portraitUrl: portraitUpload.url,
      })
      if (res.data.result) setUser(res.data.result)
      toast.success('Xác thực danh tính thành công!')
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setUploadingLabel(null)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#001f49] mb-5 tracking-tight">
            Xác thực danh tính công dân
          </h1>
          <p className="text-[#44474e] max-w-3xl text-lg leading-relaxed">
            Để đảm bảo tính minh bạch và công bằng trong quá trình bốc thăm Nhà ở Xã hội,
            vui lòng hoàn tất quy trình định danh điện tử (KYC).
          </p>
        </header>

        <div className="flex items-start justify-between relative max-w-4xl mx-auto mb-14">
          <div className="absolute top-9 left-0 w-full h-1 bg-[#e1e3e4] -translate-y-1/2 z-0" />
          <div
            className="absolute top-9 left-0 h-1 bg-[#115cb9] -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
          {steps.map(({ num, label, icon: Icon }) => (
            <div key={num} className="relative z-10 flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ring-8 ring-[#f8f9fa] transition-all ${
                step >= num ? 'bg-[#115cb9]' : 'bg-[#e1e3e4]'
              }`}>
                {step > num ? <CheckCircle size={26} className="text-white" /> : <Icon size={26} className={step >= num ? 'text-white' : 'text-[#44474e]'} />}
              </div>
              <span className={`text-base font-medium ${step >= num ? 'font-bold text-[#001f49]' : 'text-[#44474e]'}`}>{label}</span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}
              className="bg-white rounded-2xl shadow-sm p-8 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-[#001f49] mb-8 flex items-center gap-3">
                <Camera size={26} className="text-[#115cb9]" /> Tải lên Căn cước công dân
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <FileDrop id="cccd-front" label="Mặt trước thẻ CCCD" file={cccdFront} onChange={setCccdFront} />
                <FileDrop id="cccd-back" label="Mặt sau thẻ CCCD" file={cccdBack} onChange={setCccdBack} />
              </div>
              <div className="flex justify-end">
                <button onClick={goToPortrait}
                  className="flex items-center gap-2 px-8 py-3 bg-[#115cb9] text-white font-bold rounded-xl hover:bg-[#003471] transition-colors">
                  Tiếp tục <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}
              className="bg-white rounded-2xl shadow-sm p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-[#001f49] mb-8 flex items-center gap-3">
                <Scan size={26} className="text-[#115cb9]" /> Chụp ảnh chân dung
              </h2>
              <FileDrop id="portrait" label="Ảnh khuôn mặt" file={portrait} onChange={setPortrait} square />
              <div className="flex justify-between mt-8">
                <button onClick={() => setStep(1)} className="px-6 py-3 text-[#001f49] font-bold hover:bg-[#f3f4f5] rounded-xl transition-colors">
                  Quay lại
                </button>
                <button onClick={goToConfirm}
                  className="flex items-center gap-2 px-8 py-3 bg-[#115cb9] text-white font-bold rounded-xl hover:bg-[#003471] transition-colors">
                  Tiếp tục <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}>
              <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-sm p-8 max-w-5xl mx-auto">
                <h2 className="text-2xl font-bold text-[#001f49] mb-8 flex items-center gap-3">
                  <FileText size={26} className="text-[#115cb9]" /> Xác nhận thông tin OCR
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#44474e] uppercase mb-1">Họ và tên *</label>
                    <input {...register('fullName')} placeholder="Nguyễn Văn An" className={inputCls} />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#44474e] uppercase mb-1">Số CCCD *</label>
                    <input {...register('cccdNumber')} placeholder="012345678901" className={inputCls} />
                    {errors.cccdNumber && <p className="text-red-500 text-xs mt-1">{errors.cccdNumber.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#44474e] uppercase mb-1">Ngày sinh</label>
                    <input {...register('dateOfBirth')} type="date" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#44474e] uppercase mb-1">Giới tính</label>
                    <select {...register('gender')} className={selectCls}>
                      <option value="">Chọn</option>
                      <option value="NAM">Nam</option>
                      <option value="NU">Nữ</option>
                      <option value="KHAC">Khác</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#44474e] uppercase mb-1">Đối tượng ưu tiên</label>
                    <select {...register('priorityCategory')} className={selectCls}>
                      <option value="">Chọn đối tượng</option>
                      <option value="CONG_CHUC">Công chức, viên chức</option>
                      <option value="NGUOI_CO_CONG">Người có công với cách mạng</option>
                      <option value="HO_NGHEO">Hộ nghèo, cận nghèo</option>
                      <option value="CONG_NHAN">Công nhân lao động</option>
                      <option value="KHAC">Khác</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#44474e] uppercase mb-1">Tỉnh / Thành phố</label>
                    <select {...register('province')} className={selectCls}>
                      <option value="">Chọn tỉnh thành</option>
                      {provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#44474e] uppercase mb-1">Quận / Huyện</label>
                    <select {...register('district')} className={selectCls} disabled={!selectedProvince}>
                      <option value="">Chọn quận huyện</option>
                      {districts.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#44474e] uppercase mb-1">Phường / Xã</label>
                    <select {...register('ward')} className={selectCls} disabled={!selectedDistrict}>
                      <option value="">Chọn phường xã</option>
                      {wards.map((w) => <option key={w.code} value={w.code}>{w.name}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#44474e] uppercase mb-1">Địa chỉ thường trú</label>
                    <input {...register('permanentAddress')} placeholder="Số nhà, tên đường..." className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#44474e] uppercase mb-1">Nghề nghiệp</label>
                    <input {...register('occupation')} placeholder="Công chức nhà nước" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#44474e] uppercase mb-1">Thu nhập / tháng (VNĐ)</label>
                    <input {...register('incomePerMonth')} type="number" placeholder="12000000" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#44474e] uppercase mb-1">Số nhân khẩu</label>
                    <input {...register('householdSize')} type="number" placeholder="4" className={inputCls} />
                  </div>
                </div>

                <div className="mt-8 p-4 rounded-xl bg-[#f3f4f5] flex items-start gap-3 text-sm text-[#44474e]">
                  <UploadCloud size={20} className="text-[#115cb9] shrink-0 mt-0.5" />
                  <span>Ba tệp định danh sẽ được tải lên ImageKit khi bạn bấm hoàn tất. Hệ thống chỉ lưu URL trả về.</span>
                </div>

                {loading && uploadingLabel && (
                  <p className="mt-3 text-sm font-semibold text-[#115cb9]">
                    Dang tai: {uploadingLabel}
                  </p>
                )}

                <div className="flex justify-between mt-8">
                  <button type="button" onClick={() => setStep(2)} className="px-6 py-3 text-[#001f49] font-bold hover:bg-[#f3f4f5] rounded-xl transition-colors">
                    Quay lại
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex items-center gap-2 px-10 py-3 bg-[#115cb9] text-white font-bold rounded-xl hover:bg-[#003471] transition-colors disabled:opacity-70">
                    {loading ? 'Đang tải lên...' : 'Hoàn tất xác thực'} <CheckCircle size={18} />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
