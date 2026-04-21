import { useState, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { isAxiosError } from "axios";
import { weddingApi } from "../api/weddingApi.ts";
import { useWeddingForm } from "../hooks/useWeddingForm.ts";
import { useWeddingImages } from "../hooks/useWeddingImages.ts";
import { buildSubmitData } from "../wedding.utils.ts";
import { WeddingFormLayout } from "../components/WeddingFormLayout.tsx";

export const WeddingCreatePage: FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { form, step, setStep, handleNext, handlePrev, TOTAL_STEPS } = useWeddingForm();
  const images = useWeddingImages();

  const { register, control, handleSubmit, formState: { errors }, setValue, watch } = form;
  const venueLat = watch("wedding.venueLat");
  const venueLng = watch("wedding.venueLng");

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      const submitData = buildSubmitData(data);
      const formData = new FormData();
      formData.append("data", JSON.stringify(submitData));
      images.heroImages.forEach((file) => formData.append("heroImages", file));
      if (images.groomProfileImage) formData.append("groomProfileImage", images.groomProfileImage);
      if (images.brideProfileImage) formData.append("brideProfileImage", images.brideProfileImage);

      await weddingApi.create(formData);
      toast.success("초대장이 생성되었습니다!");
      navigate("/me", { replace: true });
    } catch (err) {
      const msg = isAxiosError(err) ? err.response?.data?.status?.message : undefined;
      toast.error(msg ?? "초대장 생성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleNext_ = () =>
    handleNext(() => {
      if (step === 0 && images.heroImages.length === 0) {
        toast.error("대표 이미지를 1장 이상 선택해주세요.");
        return false;
      }
      return true;
    });

  return (
    <WeddingFormLayout
      title="초대장 만들기"
      step={step}
      totalSteps={TOTAL_STEPS}
      onStepClick={setStep}
      onNext={handleNext_}
      onPrev={handlePrev}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel="생성 완료"
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
