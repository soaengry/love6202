import { useState, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { IoArrowForwardOutline, IoCheckmarkCircleOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { z } from "zod";
import type { WeddingFormData } from "../types.ts";
import { weddingApi } from "../api/weddingApi.ts";
import { STEP_FIELDS } from "../wedding.schemas.ts";
import { StepIndicator } from "../components/StepIndicator.tsx";
import { BasicInfoStep } from "../components/BasicInfoStep.tsx";
import { CoupleStep } from "../components/CoupleStep.tsx";
import { ScheduleStep } from "../components/ScheduleStep.tsx";
import { AccountStep } from "../components/AccountStep.tsx";
import { ExtraInfoStep } from "../components/ExtraInfoStep.tsx";

const TOTAL_STEPS = 5;

// 전체 폼 검증 스키마
const weddingFormSchema = z.object({
  wedding: z.object({
    title: z.string().min(1, "제목을 입력해주세요.").max(255),
    weddingDate: z.string().min(1, "예식 일시를 선택해주세요."),
    venueName: z.string().min(1, "예식장 이름을 입력해주세요.").max(255),
    venueAddress: z.string().min(1, "주소를 입력해주세요.").max(500),
    venueDetail: z.string().max(500).optional().or(z.literal("")),
    venueLat: z.number().nullable(),
    venueLng: z.number().nullable(),
    dressCode: z.string().max(255).optional().or(z.literal("")),
    notice: z.string().optional().or(z.literal("")),
    parkingInfo: z.string().optional().or(z.literal("")),
    mealInfo: z.string().optional().or(z.literal("")),
    greeting: z.string().max(1000).optional().or(z.literal("")),
  }),
  couples: z.array(
    z.object({
      role: z.enum(["GROOM", "BRIDE"]),
      name: z.string().min(1, "이름을 입력해주세요.").max(50),
      email: z.string().optional().or(z.literal("")),
      contact: z.string().max(50).optional().or(z.literal("")),
      fatherName: z.string().max(50).optional().or(z.literal("")),
      isFatherAlive: z.boolean(),
      motherName: z.string().max(50).optional().or(z.literal("")),
      isMotherAlive: z.boolean(),
    }),
  ).min(1),
  accounts: z.array(
    z.object({
      side: z.enum(["GROOM", "GROOM_FAMILY", "BRIDE", "BRIDE_FAMILY"]),
      bankName: z.string().optional().or(z.literal("")),
      bankCode: z.string().optional().or(z.literal("")),
      accountNumber: z.string().optional().or(z.literal("")),
      accountHolder: z.string().optional().or(z.literal("")),
      kakaoPayUrl: z.string().optional().or(z.literal("")),
      tossNumber: z.string().optional().or(z.literal("")),
      orderIndex: z.number(),
      paymentType: z.enum(["BANK", "KAKAOPAY", "TOSS"]),
    }),
  ),
  schedules: z.array(
    z.object({
      title: z.string().min(1, "식순 제목을 입력해주세요.").max(255),
      description: z.string().optional().or(z.literal("")),
      orderIndex: z.number(),
    }),
  ),
  transportations: z.array(
    z.object({
      type: z.enum(["SUBWAY", "BUS", "SHUTTLE"]),
      title: z.string().min(1, "교통편 제목을 입력해주세요."),
      description: z.string().optional().or(z.literal("")),
      orderIndex: z.number(),
    }),
  ),
  announcements: z.array(
    z.object({
      title: z.string().min(1, "공지사항 제목을 입력해주세요."),
      content: z.string().min(1, "공지사항 내용을 입력해주세요."),
      isPinned: z.boolean(),
    }),
  ),
});

const DEFAULT_VALUES: WeddingFormData = {
  wedding: {
    title: "",
    weddingDate: "",
    venueName: "",
    venueAddress: "",
    venueDetail: "",
    venueLat: null,
    venueLng: null,
    dressCode: "",
    notice: "",
    parkingInfo: "",
    mealInfo: "",
    greeting: "",
  },
  couples: [
    { role: "GROOM", name: "", email: "", contact: "", fatherName: "", isFatherAlive: true, motherName: "", isMotherAlive: true },
    { role: "BRIDE", name: "", email: "", contact: "", fatherName: "", isFatherAlive: true, motherName: "", isMotherAlive: true },
  ],
  accounts: [],
  schedules: [],
  transportations: [],
  announcements: [],
};

export const WeddingCreatePage: FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Image state (RHF doesn't handle File objects)
  const [heroImages, setHeroImages] = useState<File[]>([]);
  const [groomProfileImage, setGroomProfileImage] = useState<File | null>(null);
  const [brideProfileImage, setBrideProfileImage] = useState<File | null>(null);

  const form = useForm<WeddingFormData>({
    resolver: zodResolver(weddingFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
  });

  const { register, control, handleSubmit, formState: { errors }, trigger, setValue, watch } = form;
  const venueLat = watch("wedding.venueLat");
  const venueLng = watch("wedding.venueLng");

  const handleNext = async () => {
    const fields = STEP_FIELDS[step] as readonly string[];
    const valid = await trigger(fields as unknown as (keyof WeddingFormData)[]);
    if (valid) setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const handlePrev = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (data: WeddingFormData) => {
    setIsSubmitting(true);
    try {
      // weddingDate를 ISO 8601 형식으로 변환
      const submitData = {
        ...data,
        wedding: {
          ...data.wedding,
          weddingDate: new Date(data.wedding.weddingDate).toISOString(),
        },
        // orderIndex 재정렬
        schedules: data.schedules.map((s, i) => ({ ...s, orderIndex: i })),
        accounts: data.accounts.map((a, i) => {
          const { paymentType, ...rest } = a;
          if (paymentType === "KAKAOPAY") {
            return { ...rest, bankName: "카카오페이", bankCode: "KAKAOPAY", orderIndex: i };
          }
          if (paymentType === "TOSS") {
            return { ...rest, bankName: "토스", bankCode: "TOSS", accountNumber: rest.tossNumber || rest.accountNumber, orderIndex: i };
          }
          return { ...rest, orderIndex: i };
        }),
        transportations: data.transportations.map((t, i) => ({ ...t, orderIndex: i })),
      };

      const formData = new FormData();
      formData.append("data", JSON.stringify(submitData));

      heroImages.forEach((file) => formData.append("heroImages", file));
      if (groomProfileImage) formData.append("groomProfileImage", groomProfileImage);
      if (brideProfileImage) formData.append("brideProfileImage", brideProfileImage);

      await weddingApi.create(formData);
      toast.success("초대장이 생성되었습니다!");
      navigate("/me", { replace: true });
    } catch {
      toast.error("초대장 생성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="wedding-create-page min-h-screen bg-bg-secondary">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-lg mx-auto p-6"
      >
        {/* 헤더 */}
        <h1 className="text-xl font-bold text-text-primary mb-6 text-center">초대장 만들기</h1>

        <StepIndicator currentStep={step} onStepClick={setStep} />

        <form onSubmit={(e) => e.preventDefault()} className="bg-bg-primary rounded-2xl shadow-sm border border-border p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <BasicInfoStep
                  register={register}
                  errors={errors}
                  heroImages={heroImages}
                  onHeroImagesChange={setHeroImages}
                  setValue={setValue}
                  venueLat={venueLat}
                  venueLng={venueLng}
                />
              )}
              {step === 1 && (
                <CoupleStep
                  register={register}
                  errors={errors}
                  groomProfileImage={groomProfileImage}
                  brideProfileImage={brideProfileImage}
                  onGroomImageChange={setGroomProfileImage}
                  onBrideImageChange={setBrideProfileImage}
                />
              )}
              {step === 2 && (
                <ScheduleStep control={control} errors={errors} register={register} />
              )}
              {step === 3 && (
                <AccountStep control={control} errors={errors} register={register} setValue={setValue} />
              )}
              {step === 4 && (
                <ExtraInfoStep control={control} errors={errors} register={register} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* 네비게이션 버튼 */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex-1 py-3 border border-border text-text-secondary font-medium rounded-xl hover:bg-bg-secondary transition-colors cursor-pointer"
              >
                이전
              </button>
            )}

            {step < TOTAL_STEPS - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                다음
                <IoArrowForwardOutline size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(onSubmit)()}
                className="flex-1 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <IoCheckmarkCircleOutline size={18} />
                    생성 완료
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
