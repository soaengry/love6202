import { useState } from "react";

export interface WeddingImagesState {
  heroImages: File[];
  groomProfileImage: File | null;
  brideProfileImage: File | null;
  existingHeroUrls: string[];
  groomPreviewUrl: string | undefined;
  bridePreviewUrl: string | undefined;
}

export interface WeddingImagesActions {
  setHeroImages: (files: File[]) => void;
  setGroomProfileImage: (file: File | null) => void;
  setBrideProfileImage: (file: File | null) => void;
  setExistingHeroUrls: (urls: string[]) => void;
  removeExistingHeroUrl: (index: number) => void;
  setGroomPreviewUrl: (url: string | undefined) => void;
  setBridePreviewUrl: (url: string | undefined) => void;
}

export function useWeddingImages(): WeddingImagesState & WeddingImagesActions {
  const [heroImages, setHeroImages] = useState<File[]>([]);
  const [groomProfileImage, setGroomProfileImage] = useState<File | null>(null);
  const [brideProfileImage, setBrideProfileImage] = useState<File | null>(null);
  const [existingHeroUrls, setExistingHeroUrls] = useState<string[]>([]);
  const [groomPreviewUrl, setGroomPreviewUrl] = useState<string | undefined>();
  const [bridePreviewUrl, setBridePreviewUrl] = useState<string | undefined>();

  const removeExistingHeroUrl = (index: number) =>
    setExistingHeroUrls((prev) => prev.filter((_, i) => i !== index));

  return {
    heroImages, setHeroImages,
    groomProfileImage, setGroomProfileImage,
    brideProfileImage, setBrideProfileImage,
    existingHeroUrls, setExistingHeroUrls, removeExistingHeroUrl,
    groomPreviewUrl, setGroomPreviewUrl,
    bridePreviewUrl, setBridePreviewUrl,
  };
}
