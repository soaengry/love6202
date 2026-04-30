import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { weddingFormSchema, STEP_FIELDS } from "../wedding.schemas.ts";
import type { WeddingFormData } from "../types.ts";
import type { UseFormTrigger } from "react-hook-form";

const TOTAL_STEPS = 5;

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

export function useWeddingForm(defaultValues: WeddingFormData = DEFAULT_VALUES) {
  const [step, setStep] = useState(0);

  const form = useForm<WeddingFormData>({
    resolver: zodResolver(weddingFormSchema) as Resolver<WeddingFormData>,
    defaultValues,
    mode: "onTouched",
  });

  const { trigger } = form;

  const handleNext = async (preCheck?: () => boolean) => {
    if (preCheck && !preCheck()) return;
    const fields = STEP_FIELDS[step] as Parameters<UseFormTrigger<WeddingFormData>>[0];
    const valid = await trigger(fields);
    if (valid) setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const handlePrev = () => setStep((s) => Math.max(s - 1, 0));

  return { form, step, setStep, handleNext, handlePrev, TOTAL_STEPS };
}
