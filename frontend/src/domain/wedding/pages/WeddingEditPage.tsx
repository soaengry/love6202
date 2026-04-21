import { useState, useEffect, type FC } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { isAxiosError } from "axios";
import { weddingApi } from "../api/weddingApi.ts";
import { useWeddingForm } from "../hooks/useWeddingForm.ts";
import { useWeddingImages } from "../hooks/useWeddingImages.ts";
import { toWeddingFormData, buildSubmitData } from "../wedding.utils.ts";
import { WeddingFormLayout } from "../components/WeddingFormLayout.tsx";

export const WeddingEditPage: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryWeddingId = searchParams.get("weddingId");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<number | null>(null);

  const { form, step, setStep, handleNext, handlePrev, TOTAL_STEPS } = useWeddingForm();
  const images = useWeddingImages();

  const { register, control, handleSubmit, formState: { errors }, setValue, watch, reset } = form;
  const venueLat = watch("wedding.venueLat");
  const venueLng = watch("wedding.venueLng");

  // queryWeddingId를 의존성에 포함해 URL 변경 시 재페칭
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = queryWeddingId
          ? await weddingApi.getWedding(Number(queryWeddingId))
          : await weddingApi.getMyWedding();

        if (cancelled) return;

        setWeddingId(data.wedding.id);
        reset(toWeddingFormData(data));
        images.setExistingHeroUrls(data.heroImages.map((h) => h.imageUrl));
        const groom = data.couples.find((c) => c.role === "GROOM");
        const bride = data.couples.find((c) => c.role === "BRIDE");
        images.setGroomPreviewUrl(groom?.profileImageUrl ?? undefined);
        images.setBridePreviewUrl(bride?.profileImageUrl ?? undefined);
      } catch {
        if (cancelled) return;
        toast.error("초대장 정보를 불러올 수 없습니다.");
        navigate("/me", { replace: true });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [queryWeddingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = handleSubmit(async (data) => {
    if (!weddingId) return;
    setIsSubmitting(true);
    try {
      const submitData = buildSubmitData(data, {
        existingHeroImageUrls: images.existingHeroUrls,
      });
      const formData = new FormData();
      formData.append("data", JSON.stringify(submitData));
      images.heroImages.forEach((file) => formData.append("heroImages", file));
      if (images.groomProfileImage) formData.append("groomProfileImage", images.groomProfileImage);
      if (images.brideProfileImage) formData.append("brideProfileImage", images.brideProfileImage);

      await weddingApi.update(weddingId, formData);
      toast.success("초대장이 수정되었습니다!");
      navigate("/me", { replace: true });
    } catch (err) {
      const msg = isAxiosError(err) ? err.response?.data?.status?.message : undefined;
      toast.error(msg ?? "초대장 수정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <WeddingFormLayout
      title="초대장 수정하기"
      step={step}
      totalSteps={TOTAL_STEPS}
      onStepClick={setStep}
      onNext={handleNext}
      onPrev={handlePrev}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel="수정 완료"
      register={register}
      control={control}
      errors={errors}
      setValue={setValue}
      venueLat={venueLat}
      venueLng={venueLng}
      images={images}
    />
  );
};
