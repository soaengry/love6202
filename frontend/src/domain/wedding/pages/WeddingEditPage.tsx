import { useState, useEffect, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { IoArrowForwardOutline, IoCheckmarkCircleOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { z } from "zod";
import type { WeddingFormData, WeddingDetailResponse } from "../types.ts";
import { weddingApi } from "../api/weddingApi.ts";
import { STEP_FIELDS } from "../wedding.schemas.ts";
import { StepIndicator } from "../components/StepIndicator.tsx";
import { BasicInfoStep } from "../components/BasicInfoStep.tsx";
import { CoupleStep } from "../components/CoupleStep.tsx";
import { ScheduleStep } from "../components/ScheduleStep.tsx";
import { AccountStep } from "../components/AccountStep.tsx";
import { ExtraInfoStep } from "../components/ExtraInfoStep.tsx";

const TOTAL_STEPS = 5;

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

function toFormData(res: WeddingDetailResponse): WeddingFormData {
  const w = res.wedding;
  // datetime-local 형식으로 변환 (YYYY-MM-DDTHH:mm)
  const dateLocal = w.weddingDate ? new Date(w.weddingDate).toISOString().slice(0, 16) : "";

  return {
    wedding: {
      title: w.title,
      weddingDate: dateLocal,
      venueName: w.venueName,
      venueAddress: w.venueAddress,
      venueDetail: w.venueDetail ?? "",
      venueLat: w.venueLat,
      venueLng: w.venueLng,
      dressCode: w.dressCode ?? "",
      notice: w.notice ?? "",
      parkingInfo: w.parkingInfo ?? "",
      mealInfo: w.mealInfo ?? "",
    },
    couples: res.couples.map((c) => ({
      role: c.role,
      name: c.name,
      email: c.email ?? "",
      contact: c.contact ?? "",
      fatherName: c.fatherName ?? "",
      isFatherAlive: c.isFatherAlive,
      motherName: c.motherName ?? "",
      isMotherAlive: c.isMotherAlive,
    })),
    accounts: res.accounts.map((a) => ({
      side: a.side,
      bankName: a.bankName,
      bankCode: a.bankCode,
      accountNumber: a.accountNumber,
      accountHolder: a.accountHolder,
      kakaoPayUrl: a.kakaoPayUrl ?? "",
      tossNumber: a.tossNumber ?? "",
      orderIndex: a.orderIndex,
      paymentType: a.bankCode === "KAKAOPAY" ? "KAKAOPAY" as const : a.bankCode === "TOSS" ? "TOSS" as const : "BANK" as const,
    })),
    schedules: res.schedules.map((s) => ({
      title: s.title,
      description: s.description ?? "",
      orderIndex: s.orderIndex,
    })),
    transportations: res.transportations.map((t) => ({
      type: t.type,
      title: t.title,
      description: t.description ?? "",
      orderIndex: t.orderIndex,
    })),
    announcements: res.announcements.map((a) => ({
      title: a.title,
      content: a.content,
      isPinned: a.isPinned,
    })),
  };
}

export const WeddingEditPage: FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<number | null>(null);

  // Image state
  const [heroImages, setHeroImages] = useState<File[]>([]);
  const [groomProfileImage, setGroomProfileImage] = useState<File | null>(null);
  const [brideProfileImage, setBrideProfileImage] = useState<File | null>(null);

  const form = useForm<WeddingFormData>({
    resolver: zodResolver(weddingFormSchema),
    defaultValues: {
      wedding: { title: "", weddingDate: "", venueName: "", venueAddress: "", venueDetail: "", venueLat: null, venueLng: null, dressCode: "", notice: "", parkingInfo: "", mealInfo: "" },
      couples: [],
      accounts: [],
      schedules: [],
      transportations: [],
      announcements: [],
    },
    mode: "onTouched",
  });

  const { register, control, handleSubmit, formState: { errors }, trigger, setValue, watch, reset } = form;
  const venueLat = watch("wedding.venueLat");
  const venueLng = watch("wedding.venueLng");

  // 기존 데이터 로드
  useEffect(() => {
    (async () => {
      try {
        const { data } = await weddingApi.getMyWedding();
        setWeddingId(data.wedding.id);
        reset(toFormData(data));
      } catch {
        toast.error("초대장 정보를 불러올 수 없습니다.");
        navigate("/me", { replace: true });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [reset, navigate]);

  const handleNext = async () => {
    const fields = STEP_FIELDS[step] as readonly string[];
    const valid = await trigger(fields as unknown as (keyof WeddingFormData)[]);
    if (valid) setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const handlePrev = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (data: WeddingFormData) => {
    if (!weddingId) return;
    setIsSubmitting(true);
    try {
      const submitData = {
        ...data,
        wedding: {
          ...data.wedding,
          weddingDate: new Date(data.wedding.weddingDate).toISOString(),
        },
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

      await weddingApi.update(weddingId, formData);
      toast.success("초대장이 수정되었습니다!");
      navigate("/me", { replace: true });
    } catch {
      toast.error("초대장 수정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="wedding-edit-page min-h-screen bg-bg-secondary">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-lg mx-auto p-6"
      >
        <h1 className="text-xl font-bold text-gray-800 mb-6 text-center">초대장 수정하기</h1>

        <StepIndicator currentStep={step} onStepClick={setStep} />

        <form onSubmit={handleSubmit(onSubmit)} className="bg-bg-primary rounded-2xl shadow-sm border border-border p-6">
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
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    수정 중...
                  </>
                ) : (
                  <>
                    <IoCheckmarkCircleOutline size={18} />
                    수정 완료
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
